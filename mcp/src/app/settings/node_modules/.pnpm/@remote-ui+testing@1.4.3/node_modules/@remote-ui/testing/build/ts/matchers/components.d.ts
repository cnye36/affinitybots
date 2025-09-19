/// <reference types="jest" />
import type { RemoteComponentType, PropsForRemoteComponent } from '@remote-ui/core';
import { Node } from '../types';
export declare function toContainRemoteComponent<Type extends RemoteComponentType<string, any, any>>(this: jest.MatcherUtils, node: Node<unknown>, type: Type, props?: Partial<PropsForRemoteComponent<Type>>): {
    pass: boolean;
    message: () => string;
};
export declare function toContainRemoteComponentTimes<Type extends RemoteComponentType<string, any, any>>(this: jest.MatcherUtils, node: Node<unknown>, type: Type, times: number, props?: Partial<PropsForRemoteComponent<Type>>): {
    pass: boolean;
    message: () => string;
};
//# sourceMappingURL=components.d.ts.map