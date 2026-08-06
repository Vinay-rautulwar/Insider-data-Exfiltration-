import logging
import uuid
from typing import Dict, List, Any, Optional
from datetime import datetime
from app.config import settings

logger = logging.getLogger("exfiltration_db")

class MemoryCollection:
    def __init__(self, name: str):
        self.name = name
        self.documents: List[Dict[str, Any]] = []

    def insert_one(self, doc: Dict[str, Any]):
        doc_copy = dict(doc)
        if "_id" not in doc_copy:
            doc_copy["_id"] = str(uuid.uuid4())
        self.documents.insert(0, doc_copy)
        return type("InsertOneResult", (), {"inserted_id": doc_copy["_id"]})()

    def find(self, query: Dict[str, Any] = None, limit: int = 100) -> List[Dict[str, Any]]:
        results = self.documents
        if query:
            filtered = []
            for d in results:
                match = True
                for k, v in query.items():
                    if d.get(k) != v:
                        match = False
                        break
                if match:
                    filtered.append(d)
            results = filtered
        return results[:limit]

    def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        res = self.find(query, limit=1)
        return res[0] if res else None

    def update_one(self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = True):
        doc = self.find_one(query)
        if doc and "$set" in update:
            doc.update(update["$set"])
            return type("UpdateResult", (), {"modified_count": 1})()
        elif upsert and "$set" in update:
            new_doc = dict(update["$set"])
            if "_id" not in new_doc:
                new_doc["_id"] = str(uuid.uuid4())
            self.documents.insert(0, new_doc)
            return type("UpdateResult", (), {"upserted_id": new_doc["_id"]})()
        return type("UpdateResult", (), {"modified_count": 0})()

    def delete_one(self, query: Dict[str, Any]):
        doc = self.find_one(query)
        if doc and doc in self.documents:
            self.documents.remove(doc)
            return type("DeleteResult", (), {"deleted_count": 1})()
        return type("DeleteResult", (), {"deleted_count": 0})()

    def count_documents(self, filter: Dict[str, Any] = None, query: Dict[str, Any] = None) -> int:
        target_filter = filter if filter is not None else query
        return len(self.find(query=target_filter, limit=10000))

class CollectionWrapper:
    def __init__(self, collection, is_mongo: bool):
        self.coll = collection
        self.is_mongo = is_mongo

    def insert_one(self, doc: Dict[str, Any]):
        res = self.coll.insert_one(doc)
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
        return res

    def find(self, query: Dict[str, Any] = None, limit: int = 100) -> List[Dict[str, Any]]:
        q = query or {}
        if self.is_mongo:
            cursor = self.coll.find(q).limit(limit)
            docs = list(cursor)
            for d in docs:
                if "_id" in d:
                    d["_id"] = str(d["_id"])
            return docs
        else:
            return self.coll.find(query=q, limit=limit)

    def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        q = query or {}
        if self.is_mongo:
            doc = self.coll.find_one(q)
            if doc and "_id" in doc:
                doc["_id"] = str(doc["_id"])
            return doc
        else:
            return self.coll.find_one(q)

    def update_one(self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = True):
        if self.is_mongo:
            return self.coll.update_one(query, update, upsert=upsert)
        else:
            return self.coll.update_one(query, update, upsert=upsert)

    def delete_one(self, query: Dict[str, Any]):
        if self.is_mongo:
            return self.coll.delete_one(query)
        else:
            return self.coll.delete_one(query)

    def count_documents(self, filter: Dict[str, Any] = None) -> int:
        f = filter if filter is not None else {}
        if self.is_mongo:
            return self.coll.count_documents(f)
        else:
            return self.coll.count_documents(filter=f)

class Database:
    def __init__(self):
        self.is_mongo = False
        self.db = None
        self.fallback_collections: Dict[str, MemoryCollection] = {
            "telemetry": MemoryCollection("telemetry"),
            "alerts": MemoryCollection("alerts"),
            "endpoints": MemoryCollection("endpoints"),
            "simulations": MemoryCollection("simulations")
        }
        self._init_connection()

    def _init_connection(self):
        try:
            from pymongo import MongoClient
            client = MongoClient(settings.MONGODB_URL, serverSelectionTimeoutMS=1500)
            client.admin.command('ping')
            self.db = client[settings.DATABASE_NAME]
            self.is_mongo = True
            logger.info("Connected successfully to MongoDB")
        except Exception as e:
            logger.warning(f"MongoDB connection failed ({e}). Falling back to high-performance in-memory database handler.")
            self.is_mongo = False

    def get_collection(self, name: str) -> CollectionWrapper:
        if self.is_mongo and self.db is not None:
            return CollectionWrapper(self.db[name], is_mongo=True)
        if name not in self.fallback_collections:
            self.fallback_collections[name] = MemoryCollection(name)
        return CollectionWrapper(self.fallback_collections[name], is_mongo=False)

db_manager = Database()

def get_db():
    return db_manager
