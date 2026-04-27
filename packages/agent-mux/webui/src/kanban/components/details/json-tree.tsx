/**
 * Barrel re-export for backward compatibility.
 * The actual implementation has been decomposed into the json-tree/ directory.
 *
 * NOTE: When both json-tree.tsx and json-tree/index.tsx exist, bundlers
 * (webpack/Next.js) resolve the file over the directory. This barrel ensures
 * existing imports like `from "../json-tree"` continue to work.
 */
export { JsonTree, JsonTreeView } from "./json-tree/index";
