/// <reference types="react" />
import type { Node } from '../types';
export declare function assertIsNode(node: unknown, { expectation, isNot }: {
    expectation: string;
    isNot: boolean;
}): void;
export declare function assertIsType(type: unknown, { expectation, isNot }: {
    expectation: string;
    isNot: boolean;
}): void;
export declare function diffs(element: Node<any>[], props: Record<string, unknown>, expand?: boolean): string;
export declare function printType(type: string | React.ComponentType<any>): string;
export declare function diffPropsForNode(node: Node<any>, props: Record<string, unknown>, { expand }: {
    expand?: boolean | undefined;
}): string | null;
export declare function pluralize(word: string, count: number): string;
export declare function printReceivedWithHighlight(text: string, start: number, length: number): string;
//# sourceMappingURL=utilities.d.ts.map