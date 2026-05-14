import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export function useFirestoreCollection<T = DocumentData>(
  collectionName: string, 
  constraints: QueryConstraint[] = [],
  operationName: string = collectionName
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, collectionName), ...constraints);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as unknown as T[];
      setData(docs);
      setLoading(false);
    }, (err) => {
      console.error(`Error fetching ${operationName}:`, err);
      handleFirestoreError(err, OperationType.LIST, collectionName);
      setError(err as Error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, JSON.stringify(constraints)]);

  return { data, loading, error };
}
