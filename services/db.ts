
import { User, Photo, Album, SocialPost } from '../types';
import { 
    collection, 
    doc, 
    setDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    limit
} from "firebase/firestore";
import { firestore, isFirebaseReady } from './firebase';

export const db = {
  // --- USERS ---
  saveUser: async (user: User): Promise<void> => {
    if (user.isGuest) return;
    if (isFirebaseReady && firestore) {
        const userRef = doc(firestore, "users", user.id);
        await setDoc(userRef, user, { merge: true });
    }
  },

  // --- PHOTOS ---
  savePhoto: async (photo: Photo, userId: string): Promise<void> => {
    const photoData = { ...photo, ownerId: userId };
    if (isFirebaseReady && firestore) {
        const photoRef = doc(firestore, "photos", photo.id);
        await setDoc(photoRef, photoData);
    }
  },

  listenToPhotos: (userId: string, callback: (photos: Photo[]) => void) => {
      if (isFirebaseReady && firestore) {
          const q = query(collection(firestore, "photos"), where("ownerId", "==", userId), orderBy("timestamp", "desc"));
          return onSnapshot(q, (snapshot) => {
              const photos = snapshot.docs.map(d => d.data() as Photo);
              callback(photos);
          });
      }
      return () => {};
  },

  // --- ALBUMS ---
  createAlbum: async (album: Album): Promise<void> => {
      if (isFirebaseReady && firestore) {
           await setDoc(doc(firestore, "albums", album.id), album);
      }
  },

  listenToAlbums: (userId: string, callback: (albums: Album[]) => void) => {
      if (isFirebaseReady && firestore) {
          const q = query(collection(firestore, "albums"), where("ownerId", "==", userId));
          return onSnapshot(q, (snapshot) => {
              const albums = snapshot.docs.map(d => d.data() as Album);
              callback(albums);
          });
      }
      return () => {};
  },

  // --- SOCIAL ---
  savePost: async (post: SocialPost): Promise<void> => {
      if (isFirebaseReady && firestore) {
          await setDoc(doc(firestore, "posts", post.id), post);
      }
  },

  listenToFeed: (callback: (posts: SocialPost[]) => void) => {
      if (isFirebaseReady && firestore) {
          const q = query(collection(firestore, "posts"), orderBy("timestamp", "desc"), limit(50));
          return onSnapshot(q, (snapshot) => {
              const posts = snapshot.docs.map(d => d.data() as SocialPost);
              callback(posts);
          });
      }
      return () => {};
  }
};
