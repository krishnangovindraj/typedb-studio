/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import {EdgeKind, TypeKind, Value} from "./concept";
import {DataConstraintSpan} from "../graph-visualiser/graph";

export type QueryVertexKind = "variable" | "label" | "value" | "unavailableVariable" | "expression" | "functionCall";

export interface QueryVertexVariable {
    kind: "variable";
    variable: string,
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
    variable: string,
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
    span: QueryConstraintSpan,

    instance: QueryVertexVariable | QueryVertexUnavailable,
    type: QueryVertexVariable | QueryVertexLabel | QueryVertexUnavailable,
    exactness: QueryConstraintExactness,
}

export interface QueryConstraintHas {
    kind: "has",
    span: QueryConstraintSpan,

    owner: QueryVertexVariable | QueryVertexUnavailable
    attribute: QueryVertexVariable | QueryVertexUnavailable,
    exactness: QueryConstraintExactness,
}


export interface QueryConstraintLinks {
    kind: "links",
    span: QueryConstraintSpan,

    relation: QueryVertexVariable | QueryVertexUnavailable,
    player: QueryVertexVariable | QueryVertexUnavailable,
    role: QueryVertexVariable | QueryVertexLabel | QueryVertexUnavailable,
    exactness: QueryConstraintExactness,
}

// Type
export interface QueryConstraintSub {
    kind: "sub",
    span: QueryConstraintSpan,

    subtype: QueryVertexVariable | QueryVertexLabel | QueryVertexUnavailable,
    supertype: QueryVertexVariable | QueryVertexLabel | QueryVertexUnavailable,
    exactness: QueryConstraintExactness,
}

export interface QueryConstraintOwns {
    kind: "owns",
    span: QueryConstraintSpan,

    owner: QueryVertexVariable | QueryVertexLabel | QueryVertexUnavailable,
    attribute: QueryVertexVariable | QueryVertexLabel | QueryVertexUnavailable,
    exactness: QueryConstraintExactness,
}

export interface QueryConstraintRelates {
    kind: "relates",
    span: QueryConstraintSpan,

    relation: QueryVertexVariable | QueryVertexLabel | QueryVertexUnavailable,
    role: QueryVertexVariable | QueryVertexLabel | QueryVertexUnavailable,
    exactness: QueryConstraintExactness,
}

export interface QueryConstraintPlays {
    kind: "plays",
    span: QueryConstraintSpan,

    player: QueryVertexVariable | QueryVertexLabel | QueryVertexUnavailable,
    role: QueryVertexVariable | QueryVertexLabel | QueryVertexUnavailable,
    exactness: QueryConstraintExactness,
}

// Function
export interface QueryConstraintExpression {
    kind: "expression",
    span: QueryConstraintSpan,

    text: string,
    arguments: (QueryVertexVariable | QueryVertexUnavailable)[],
    assigned: (QueryVertexVariable | QueryVertexUnavailable)[],
}

export interface QueryConstraintFunction {
    kind: "functionCall",
    span: QueryConstraintSpan,

    name: string,
    arguments: (QueryVertexVariable | QueryVertexUnavailable)[],
    assigned: (QueryVertexVariable | QueryVertexUnavailable)[],
}
