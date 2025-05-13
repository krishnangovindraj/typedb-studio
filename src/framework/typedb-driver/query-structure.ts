/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { EdgeKind, TypeKind, Value } from "./concept";

export type QueryVertexKind = "variable" | "label" | "value" | "unavailableVariable" | "expression" | "functionCall";

export interface QueryVertexVariable {
    kind: "variable";
    value: { variable: string };
}

export interface QueryVertexLabel {
    kind: "label";
    value: { kind: TypeKind, label: string };
}

export interface QueryVertexValue {
    kind: "value";
    value: Value;
}

export interface QueryVertexUnavailable {
    kind: "unavailableVariable";
    value: { variable: string };
}

export type QueryVertex = QueryVertexVariable | QueryVertexLabel | QueryVertexValue | QueryVertexUnavailable;
// TODO:
// export enum VertexKindOther = { }

export type QueryEdge = {
    type: QueryEdgeType,
    to: QueryVertex,
    from: QueryVertex,
    span: { begin: number, end: number }
};

export type QueryEdgeType = { kind: EdgeKind, param: QueryVertex | null | string };

export type QueryStructure = { branches: { constraints: QueryConstraintAny[] }[] };

export type QueryConstraintAny = QueryConstraintIsa | QueryConstraintHas | QueryConstraintLinks |
    QueryConstraintSub | QueryConstraintOwns | QueryConstraintRelates | QueryConstraintPlays |
    QueryConstraintExpression | QueryConstraintFunction;

export type QueryConstraintSpan = { begin: number, end: number };
export type QueryConstraintExactness = "exact" | "subtypes";
// Instance
export interface QueryConstraintIsa {
    kind: "isa",
    constraint: {
        instance: QueryVertexVariable | QueryVertexUnavailable,
        type: QueryVertexVariable | QueryVertexLabel | QueryVertexUnavailable,
        exactness: QueryConstraintExactness,
        span: QueryConstraintSpan,
    }
}

export interface QueryConstraintHas {
    kind: "has",
    constraint: {
        owner: QueryVertexVariable| QueryVertexUnavailable
        attribute: QueryVertexVariable | QueryVertexUnavailable,
        exactness: QueryConstraintExactness,
        span: QueryConstraintSpan,
    },
}


export interface QueryConstraintLinks {
    kind: "links",
    constraint: {
        relation: QueryVertexVariable | QueryVertexUnavailable,
        player: QueryVertexVariable | QueryVertexUnavailable,
        role: QueryVertexVariable | QueryVertexLabel | QueryVertexUnavailable,
        exactness: QueryConstraintExactness,
        span: QueryConstraintSpan,
    }
}

// Type
export interface QueryConstraintSub {
    kind: "sub",
    constraint: {
        subtype: QueryVertexVariable | QueryVertexLabel | QueryVertexUnavailable,
        supertype: QueryVertexVariable | QueryVertexLabel | QueryVertexUnavailable,
        exactness: QueryConstraintExactness,
        span: QueryConstraintSpan,
    }
}

export interface QueryConstraintOwns {
    kind: "owns",
    constraint: {
        owner: QueryVertexVariable | QueryVertexLabel | QueryVertexUnavailable,
        attribute: QueryVertexVariable | QueryVertexLabel | QueryVertexUnavailable,
        exactness: QueryConstraintExactness,
        span: QueryConstraintSpan,
    }
}

export interface QueryConstraintRelates {
    kind: "relates",
    constraint: {
        relation: QueryVertexVariable | QueryVertexLabel | QueryVertexUnavailable,
        role: QueryVertexVariable | QueryVertexLabel | QueryVertexUnavailable,
        exactness: QueryConstraintExactness,
        span: QueryConstraintSpan,
    }
}

export interface QueryConstraintPlays {
    kind: "plays",
    constraint: {
        player: QueryVertexVariable | QueryVertexLabel | QueryVertexUnavailable,
        role: QueryVertexVariable | QueryVertexLabel | QueryVertexUnavailable,
        exactness: QueryConstraintExactness,
        span: QueryConstraintSpan,
    }
}

// Function
export interface QueryConstraintExpression {
    kind: "expression",
    constraint: {
        text: string,
        arguments: (QueryVertexVariable| QueryVertexUnavailable)[],
        assigned: (QueryVertexVariable| QueryVertexUnavailable)[],
        span: QueryConstraintSpan,
    }
}

export interface QueryConstraintFunction {
    kind: "function",
    constraint: {
        name: string,
        arguments: (QueryVertexVariable | QueryVertexValue | QueryVertexUnavailable)[],
        assigned: (QueryVertexVariable | QueryVertexUnavailable)[],
        span: QueryConstraintSpan,
    }
}
