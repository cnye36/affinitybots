import type { RemoteRoot } from '@remote-ui/core';
import { Node, RootNode } from './types';
export declare function createTestRoot(): RemoteRoot<any, any>;
export declare function mount<Root extends RemoteRoot<any, any> = RemoteRoot<any, any>>(run: (root: Root) => void, root?: Root): RootNode<unknown>;
export declare function isNode<Props = unknown>(maybeNode: unknown): maybeNode is Node<Props>;
//# sourceMappingURL=mount.d.ts.map