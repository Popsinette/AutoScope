import { IndexedDbFiles, LocalStoragePersistence } from "./persistence";
import { DemoStore } from "./store";

/** Instance unique de la démo, persistée dans le navigateur. */
export const demoStore = new DemoStore(new LocalStoragePersistence(), new IndexedDbFiles());
