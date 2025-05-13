import {
    Attribute, AttributeType,
    Concept,
    EdgeKind, Entity, EntityType,
    InstantiableType, Relation, RelationType,
    RoleType,
    ThingKind,
    Type,
    TypeKind, Value,
    ValueKind
} from "../typedb-driver/concept";
import {
    QueryConstraintAny,
    QueryConstraintExactness, QueryConstraintExpression, QueryConstraintFunction, QueryConstraintHas,
    QueryConstraintIsa, QueryConstraintLinks, QueryConstraintOwns, QueryConstraintPlays, QueryConstraintRelates,
    QueryConstraintSpan,
    QueryConstraintSub,
    QueryVertex,
} from "../typedb-driver/query-structure";
import { ConceptRow, ConceptRowsQueryResponse } from "../typedb-driver/response";
import { MultiGraph } from "graphology";

///////////////////////
// TypeDB Data Graph //
///////////////////////

export type SpecialVertexKind = "unavailable" | "expression" | "functionCall";

export type VertexUnavailable = { kind: "unavailable", variable: string, answerIndex: number, vertex_map_key: string };
export type VertexExpression = { kind: "expression", repr: string, answerIndex: number, vertex_map_key: string };
export type VertexFunction = { kind: "functionCall", repr: string, answerIndex: number, vertex_map_key: string };
export type DataVertexSpecial = VertexUnavailable | VertexFunction | VertexExpression;

export type DataVertexKind = ThingKind | TypeKind | ValueKind | SpecialVertexKind;
export type DataVertex = Concept | DataVertexSpecial;

export type QueryCoordinates = { branch: number, constraint: number };

export type DataGraph = {
  answers: DataConstraintAny[][];
}

export type DataConstraintAny = DataConstraintIsa | DataConstraintHas | DataConstraintLinks |
    DataConstraintSub | DataConstraintOwns | DataConstraintRelates | DataConstraintPlays |
    DataConstraintExpression | DataConstraintFunction;

export type DataConstraintSpan = QueryConstraintSpan;
export type DataConstraintExactness = QueryConstraintExactness;
// Instance
export interface DataConstraintIsa {
    kind: "isa",
    span: DataConstraintSpan,
    queryCoordinates: QueryCoordinates,
    queryConstraint: QueryConstraintIsa,
    constraint: {
        instance: Entity | Relation | Attribute | VertexUnavailable,
        type: InstantiableType | VertexUnavailable,
        exactness: DataConstraintExactness,
    }
}

export interface DataConstraintHas {
    kind: "has",
    span: DataConstraintSpan,
    queryCoordinates: QueryCoordinates,
    queryConstraint: QueryConstraintHas,
    constraint: {
        owner: Entity | Relation  | VertexUnavailable,
        attribute: Attribute | VertexUnavailable,
        exactness: DataConstraintExactness,
    },
}


export interface DataConstraintLinks {
    kind: "links",
    span: DataConstraintSpan,
    queryCoordinates: QueryCoordinates,
    queryConstraint: QueryConstraintLinks,
    constraint: {
        relation: Relation | VertexUnavailable,
        player: Relation | Entity | VertexUnavailable,
        role: RoleType | VertexUnavailable,
        exactness: DataConstraintExactness,
    }
}

// Type
export interface DataConstraintSub {
    kind: "sub",
    span: DataConstraintSpan,
    queryCoordinates: QueryCoordinates,
    queryConstraint: QueryConstraintSub,
    constraint: {
        subtype: Type | VertexUnavailable,
        supertype: Type | VertexUnavailable,
        exactness: DataConstraintExactness,
    }
}

export interface DataConstraintOwns {
    kind: "owns",
    span: DataConstraintSpan,
    queryCoordinates: QueryCoordinates,
    queryConstraint: QueryConstraintOwns,
    constraint: {
        owner: EntityType | RelationType | VertexUnavailable,
        attribute: AttributeType | VertexUnavailable,
        exactness: DataConstraintExactness,
    }
}

export interface DataConstraintRelates {
    kind: "relates",
    span: DataConstraintSpan,
    queryCoordinates: QueryCoordinates,
    queryConstraint: QueryConstraintRelates,
    constraint: {
        relation: RelationType | VertexUnavailable,
        role: RoleType | VertexUnavailable,
        exactness: DataConstraintExactness,
    }
}

export interface DataConstraintPlays {
    kind: "plays",
    span: DataConstraintSpan,
    queryCoordinates: QueryCoordinates,
    queryConstraint: QueryConstraintPlays,
    constraint: {
        player: EntityType | RelationType | VertexUnavailable,
        role: RoleType | VertexUnavailable,
        exactness: DataConstraintExactness,
    }
}

// Function
export interface DataConstraintExpression {
    kind: "expression",
    span: DataConstraintSpan,
    queryCoordinates: QueryCoordinates,
    queryConstraint: QueryConstraintExpression,
    constraint: {
        text: string,
        arguments: (Entity | Relation | Attribute | Value | VertexUnavailable)[],
        assigned: (Entity | Relation | Attribute | Value | VertexUnavailable)[],
    }
}

export interface DataConstraintFunction {
    kind: "function",
    span: DataConstraintSpan,
    queryCoordinates: QueryCoordinates,
    queryConstraint: QueryConstraintFunction,
    constraint: {
        name: string,
        arguments: (Entity | Relation | Attribute | Value | VertexUnavailable)[],
        assigned: (Entity | Relation | Attribute | Value | VertexUnavailable)[],
    }
}

export interface VertexMetadata {
    defaultLabel: string;
    hoverLabel: string;
    concept: DataVertex;
}

export interface VertexAttributes {
    label: string;
    color: string;
    size: number;
    type: string;
    x: number;
    y: number;
    metadata: VertexMetadata;
    highlighted: boolean;
}

export interface EdgeMetadata {
    answerIndex: number;
    dataEdge: DataConstraintAny;
}

export interface EdgeAttributes {
    label: string;
    color: string;
    size: number;
    type: string;
    metadata: EdgeMetadata;
}

export interface GraphAttributes {}

export type VisualGraph = MultiGraph<VertexAttributes, EdgeAttributes, GraphAttributes>;

export const newVisualGraph: () => VisualGraph = () => new MultiGraph<VertexAttributes, EdgeAttributes, GraphAttributes>();

///////////////////////////////////
// TypeDB server -> logical graph
///////////////////////////////////
export function constructGraphFromRowsResult(rows_result: ConceptRowsQueryResponse) : DataGraph {
    return new LogicalGraphBuilder().build(rows_result);
}

function is_branch_involved(provenanceBitArray: Array<number>, branchIndex: number) {
    let provenanceByteIndex = branchIndex >> 3; // divide by 8
    let provenanceBitWithinByte = (1 << (branchIndex % 8));
    return 0 == branchIndex || 0 != (provenanceBitArray[provenanceByteIndex] & provenanceBitWithinByte)
}

class LogicalGraphBuilder {
    constructor() { }

    build(rows_result: ConceptRowsQueryResponse) : DataGraph {
        let answers: DataConstraintAny[][] = [];
        rows_result.answers.forEach((row, answerIndex) => {
            let current_answer_edges = row.involvedBranches.flatMap(branchIndex => {
                return rows_result.queryStructure!.branches[branchIndex].constraints.map((constraint, constraintIndex) => {
                    return this.toDataConstraint(answerIndex, constraint, row.data, { branch: branchIndex, constraint: constraintIndex});
                });
            });
            answers.push(current_answer_edges);
        });
        return { answers: answers };
    }

    translate_vertex(structure_vertex: QueryVertex, answerIndex: number, data: ConceptRow): DataVertex {
        switch (structure_vertex.kind) {
            case "variable": {
                return data[structure_vertex.value.variable] as Concept;
            } 
            case "label": {
                let vertex= structure_vertex.value;
                return { kind: vertex.kind, label: vertex.label } as Type;
            }
            case "value": {
                return structure_vertex.value;
            }
            case "unavailableVariable": {
                let vertex = structure_vertex.value;
                let key = "unavailable[" + vertex.variable + "][" + answerIndex + "]";
                return { kind: "unavailable", vertex_map_key: key, answerIndex: answerIndex, variable: vertex.variable } as VertexUnavailable;
            }
            default: {
                throw new Error("Unsupported vertex type: " + structure_vertex);
            }
        }
    }

    private toDataConstraint(answerIndex: number, constraint: QueryConstraintAny, data: ConceptRow, coordinates: QueryCoordinates): DataConstraintAny {
        switch (constraint.kind) {
            case "isa": {
                let inner = constraint.constraint;
                return {
                    kind: "isa",
                    span: constraint.span,
                    queryCoordinates: coordinates,
                    queryConstraint: constraint,
                    constraint: {
                        instance: this.translate_vertex(inner.instance, answerIndex, data) as (Entity | Relation | Attribute | VertexUnavailable),
                        type: this.translate_vertex(inner.type, answerIndex, data) as (InstantiableType | VertexUnavailable),
                        exactness: inner.exactness,
                    }
                }
            }
            case "has": {
                let inner = constraint.constraint;
                return {
                    kind: "has",
                    span: constraint.span,
                    queryCoordinates: coordinates,
                    queryConstraint: constraint,
                    constraint: {
                        owner: this.translate_vertex(inner.owner, answerIndex, data) as (Entity | Relation | VertexUnavailable),
                        attribute: this.translate_vertex(inner.attribute, answerIndex, data) as (Attribute | VertexUnavailable),
                        exactness: inner.exactness,
                    }
                }
            }
            case "links": {
                let inner = constraint.constraint;
                return {
                    kind: "links",
                    span: constraint.span,
                    queryCoordinates: coordinates,
                    queryConstraint: constraint,
                    constraint: {
                        relation: this.translate_vertex(inner.relation, answerIndex, data) as (Relation | VertexUnavailable),
                        player: this.translate_vertex(inner.player, answerIndex, data) as (Entity | Relation | VertexUnavailable),
                        role: this.translate_vertex(inner.role, answerIndex, data) as (RoleType | VertexUnavailable),
                        exactness: inner.exactness,
                    }
                }
            }
            case "sub": {
                let inner = constraint.constraint;
                return {
                    kind: "sub",
                    span: constraint.span,
                    queryCoordinates: coordinates,
                    queryConstraint: constraint,
                    constraint: {
                        subtype: this.translate_vertex(inner.subtype, answerIndex, data) as (Type | VertexUnavailable),
                        supertype: this.translate_vertex(inner.supertype, answerIndex, data) as (Type | VertexUnavailable),
                        exactness: inner.exactness,
                    }
                }
            }
            case "owns": {
                let inner = constraint.constraint;
                return {
                    kind: "owns",
                    span: constraint.span,
                    queryCoordinates: coordinates,
                    queryConstraint: constraint,
                    constraint: {
                        owner: this.translate_vertex(inner.owner, answerIndex, data) as (EntityType | RelationType | VertexUnavailable),
                        attribute: this.translate_vertex(inner.attribute, answerIndex, data) as (AttributeType | VertexUnavailable),
                        exactness: inner.exactness,
                    }
                }
            }
            case "relates": {
                let inner = constraint.constraint;
                return {
                    kind: "relates",
                    span: constraint.span,
                    queryCoordinates: coordinates,
                    queryConstraint: constraint,
                    constraint: {
                        relation: this.translate_vertex(inner.relation, answerIndex, data) as (RelationType | VertexUnavailable),
                        role: this.translate_vertex(inner.role, answerIndex, data) as (RoleType | VertexUnavailable),
                        exactness: inner.exactness,
                    }
                }
            }
            case "plays": {
                let inner = constraint.constraint;
                return {
                    kind: "plays",
                    span: constraint.span,
                    queryCoordinates: coordinates,
                    queryConstraint: constraint,
                    constraint: {
                        player: this.translate_vertex(inner.player, answerIndex, data) as (EntityType | RelationType | VertexUnavailable),
                        role: this.translate_vertex(inner.role, answerIndex, data) as (RoleType | VertexUnavailable),
                        exactness: inner.exactness,
                    }
                }
            }
            case "expression":  {
                let inner = constraint.constraint;
                return {
                    kind: "expression",
                    span: constraint.span,
                    queryCoordinates: coordinates,
                    queryConstraint: constraint,
                    constraint: {
                        text: inner.text,
                        arguments: inner.arguments.map(vertex => this.translate_vertex(vertex, answerIndex, data) as (Entity | Relation | Attribute | Value | VertexUnavailable)),
                        assigned: inner.assigned.map(vertex => this.translate_vertex(vertex, answerIndex, data) as (Entity | Relation | Attribute | Value | VertexUnavailable)),
                    }
                }
            }
            case "functionCall":{
                let inner = constraint.constraint;
                return {
                    kind: "function",
                    span: constraint.span,
                    queryCoordinates: coordinates,
                    queryConstraint: constraint,
                    constraint: {
                        name: inner.name,
                        arguments: inner.arguments.map(vertex => this.translate_vertex(vertex, answerIndex, data) as (Entity | Relation | Attribute | Value | VertexUnavailable)),
                        assigned: inner.assigned.map(vertex => this.translate_vertex(vertex, answerIndex, data) as (Entity | Relation | Attribute | Value | VertexUnavailable)),
                    }
                }
            }
            default: {
                console.log("Unsupported Constraint:"+ constraint)
                throw new Error("Unsupported Constraint:"+ constraint);
            }
        }
    }
}
