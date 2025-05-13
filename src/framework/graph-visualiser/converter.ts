import {
    Attribute,
    AttributeType,
    Concept,
    Entity,
    EntityType,
    Relation,
    RelationType,
    RoleType,
    Type,
    Value
} from "../typedb-driver/concept";
import {
    QueryConstraintAny,
    QueryEdge,
    QueryStructure,
    QueryVertex,
    QueryVertexKind
} from "../typedb-driver/query-structure";
import {
    EdgeAttributes,
    EdgeMetadata,
    DataVertex,
    QueryCoordinates,
    VertexAttributes,
    VertexMetadata,
    VertexUnavailable,
    VisualGraph,
    DataConstraintExpression,
    DataConstraintFunction,
    DataConstraintAny,
    DataConstraintIsa,
    DataConstraintLinks,
    DataConstraintHas,
    DataConstraintSub,
    DataConstraintOwns,
    DataConstraintRelates,
    DataConstraintPlays,
    VertexFunction,
    VertexExpression
} from "./graph";
import {ILogicalGraphConverter} from "./visualisation";
import {StudioConverterStructureParameters, StudioConverterStyleParameters} from "./config";

export class StudioConverter implements ILogicalGraphConverter {

    constructor(
        public readonly graph: VisualGraph, public readonly queryStructure: QueryStructure,
        public readonly isFollowupQuery: boolean, public readonly structureParameters: StudioConverterStructureParameters,
        public readonly styleParameters: StudioConverterStyleParameters
    ) {
    }

    private vertexMetadata(vertex: DataVertex): VertexMetadata {
        return {
            defaultLabel: this.styleParameters.vertex_default_label(vertex),
            hoverLabel: this.styleParameters.vertex_hover_label(vertex),
            concept: vertex,
        };
    }

    private vertexAttributes(vertex: DataVertex): VertexAttributes {
        // Extend as you please: https://www.sigmajs.org/docs/advanced/data/
        const color = this.styleParameters.vertex_colors[vertex.kind];
        const shape = this.styleParameters.vertex_shapes[vertex.kind];
        return {
            label: this.styleParameters.vertex_default_label(vertex),
            color: color.hex(),
            size: vertex.kind === "roleType" ? 5 : this.styleParameters.vertex_size,
            type: shape,
            x: Math.random(),
            y: Math.random(),
            metadata: this.vertexMetadata(vertex),
            highlighted: false,
        }
    }

    private edgeMetadata(answerIndex: number, edge: DataConstraintAny): EdgeMetadata {
        if (this.isFollowupQuery) {
            return { answerIndex: -1, dataEdge: edge };
        } else {
            return { answerIndex, dataEdge: edge };
        }
    }

    private edgeAttributes(label: string, metadata: EdgeMetadata): EdgeAttributes {
        // Extend as you please: https://www.sigmajs.org/docs/advanced/data/
        const color = this.styleParameters.edge_color;
        return {
            label: label,
            color: color.hex(),
            size: this.styleParameters.edge_size,
            type: "arrow",
            metadata: metadata,
        }
    }

    private edgeKey(from_id: string, to_id: string, edge_type_id: string) : string {
        return `${from_id}:${to_id}:${edge_type_id}`;
    }

    private maybeCreateEdge(answerIndex: number, edge: DataConstraintAny, label: string, from: DataVertex, to: DataVertex, queryFrom: QueryVertex, queryTo: QueryVertex) {
        if (this.shouldCreateEdge(edge, queryFrom, queryTo)) {
            let fromKey = this.put_vertex(answerIndex, from, queryFrom);
            let toKey = this.put_vertex(answerIndex, to, queryTo);
            let edgeKey = this.edgeKey(fromKey, toKey, label);
            const attributes = this.edgeAttributes("isa", this.edgeMetadata(answerIndex, edge));
            this.createEdge(edgeKey, from, to, attributes);
        } else {
            if (this.shouldCreateNode(from, queryFrom)) {
                this.put_vertex(answerIndex, from, queryFrom);
            }
            if (this.shouldCreateNode(to, queryTo)) {
                this.put_vertex(answerIndex, to, queryTo);
            }
        }
    }

    // ILogicalGraphConverter
    // Vertices
    put_vertex(answerIndex: number, vertex: DataVertex, queryVertex: QueryVertex): string {
        const key = vertexMapKey(vertex);
        if (this.shouldCreateNode(vertex, queryVertex) && !this.graph.hasNode(key))  {
            this.graph.addNode(key, this.vertexAttributes(vertex));
        }
        return key;
    }

    // Edges
    put_isa(answerIndex: number, constraint: DataConstraintIsa): void {
        let isa =  constraint.constraint;
        let queryConstraint =  constraint.queryConstraint.constraint;
        let label = constraint.constraint.exactness == "exact" ? constraint.kind + "!" : constraint.kind;
        this.maybeCreateEdge(answerIndex, constraint, label, isa.instance, isa.type, queryConstraint.instance, queryConstraint.type);
    }

    put_has(answerIndex: number, constraint: DataConstraintHas): void {
        let has =  constraint.constraint;
        let queryConstraint =  constraint.queryConstraint.constraint;
        let label = constraint.constraint.exactness == "exact" ? constraint.kind + "!" : constraint.kind;
        this.maybeCreateEdge(answerIndex, constraint, label, has.owner, has.attribute, queryConstraint.owner, queryConstraint.attribute);
    }

    put_links(answerIndex: number, constraint: DataConstraintLinks): void {
        let links = constraint.constraint;
        let queryConstraint =  constraint.queryConstraint.constraint;
        const label = links.role.kind === "roleType" ? links.role.label.split(":").at(-1) : `?`;
        if (!label) throw `${this.put_links.name}: invalid role label '${JSON.stringify(links.role)}'`;
        this.maybeCreateEdge(answerIndex, constraint, label, links.relation, links.player, queryConstraint.relation, queryConstraint.player);
    }

    put_sub(answerIndex: number, constraint: DataConstraintSub): void {
        let sub = constraint.constraint;
        let queryConstraint =  constraint.queryConstraint.constraint;
        let label = constraint.constraint.exactness == "exact" ? constraint.kind + "!" : constraint.kind;
        this.maybeCreateEdge(answerIndex, constraint, label, sub.subtype, sub.supertype, queryConstraint.subtype, queryConstraint.supertype);
    }

    put_owns(answerIndex: number, constraint: DataConstraintOwns): void {
        let owns = constraint.constraint;
        let queryConstraint =  constraint.queryConstraint.constraint;
        let label = constraint.constraint.exactness == "exact" ? constraint.kind + "!" : constraint.kind;
        this.maybeCreateEdge(answerIndex, constraint, label, owns.owner, owns.attribute, queryConstraint.owner, queryConstraint.attribute);
    }

    put_relates(answerIndex: number, constraint: DataConstraintRelates): void {
        let relates = constraint.constraint;
        let queryConstraint =  constraint.queryConstraint.constraint;
        let label = constraint.constraint.exactness == "exact" ? constraint.kind + "!" : constraint.kind;
        this.maybeCreateEdge(answerIndex, constraint, label, relates.relation, relates.role, queryConstraint.relation, queryConstraint.role);
    }

    put_plays(answerIndex: number, constraint: DataConstraintPlays): void {
        let plays = constraint.constraint;
        let queryConstraint =  constraint.queryConstraint.constraint;
        let label = constraint.constraint.exactness == "exact" ? constraint.kind + "!" : constraint.kind;
        this.maybeCreateEdge(answerIndex, constraint, label, plays.player, plays.role, queryConstraint.player, queryConstraint.role);
    }

    put_expression(answerIndex: number, constraint: DataConstraintExpression): void {
        let expression = constraint.constraint;
        let expressionVertexKey = `expr_${answerIndex}_${constraint.queryCoordinates.branch}_{${constraint.queryCoordinates.constraint}}`;
        let expressionVertex: VertexExpression = {  kind: "expression", answerIndex: answerIndex, repr: constraint.constraint.text, vertex_map_key: expressionVertexKey}
        expression.assigned
            .forEach((assigned, i) => {
                let queryVertex = constraint.queryConstraint.constraint.assigned[i];
                if (this.shouldCreateNode(assigned, queryVertex)) {
                    let label = `assign[${queryVertex.value.variable}]`;
                    let assignedKey = this.put_vertex(answerIndex, assigned, queryVertex);
                    let edgeKey = this.edgeKey(expressionVertexKey, assignedKey, label);
                    this.createEdge(edgeKey, expressionVertex, assigned, this.edgeAttributes(label, this.edgeMetadata(answerIndex, constraint)));
                }
            });
        expression.arguments
            .forEach((arg, i) => {
                let queryVertex = constraint.queryConstraint.constraint.arguments[i];
                if (this.shouldCreateNode(arg, queryVertex)) {
                    let label = `arg[${queryVertex.value.variable}]`;
                    let argKey = this.put_vertex(answerIndex, arg, queryVertex);
                    let edgeKey = this.edgeKey(expressionVertexKey, argKey, label);
                    this.createEdge(edgeKey, expressionVertex, arg, this.edgeAttributes(label, this.edgeMetadata(answerIndex, constraint)));
                }
            });
    }

    put_function(answerIndex: number, constraint: DataConstraintFunction): void {
        let functionCall = constraint.constraint;
        let functionVertexKey = `f_${answerIndex}_${constraint.queryCoordinates.branch}_{${constraint.queryCoordinates.constraint}}`;
        let functionVertex: VertexFunction = {  kind: "functionCall", answerIndex: answerIndex, repr: constraint.constraint.name, vertex_map_key: functionVertexKey}
        functionCall.assigned
            .forEach((assigned, i) => {
                let queryVertex = constraint.queryConstraint.constraint.assigned[i];
                if (this.shouldCreateNode(assigned, queryVertex)) {
                    let label = `assign[${queryVertex.value.variable}]`;
                    let assignedKey = this.put_vertex(answerIndex, assigned, queryVertex);
                    let edgeKey = this.edgeKey(functionVertexKey, assignedKey, label);
                    this.createEdge(edgeKey, functionVertex, assigned, this.edgeAttributes(label, this.edgeMetadata(answerIndex, constraint)));
                }
            });
        functionCall.arguments
            .forEach((arg, i) => {
                let queryVertex = constraint.queryConstraint.constraint.arguments[i];
                if (queryVertex.kind != "value" && this.shouldCreateNode(arg, queryVertex)) {
                    let label = `arg[${queryVertex.value.variable}]`;
                    let argKey = this.put_vertex(answerIndex, arg, queryVertex);
                    let edgeKey = this.edgeKey(functionVertexKey, argKey, label);
                    this.createEdge(edgeKey, functionVertex, arg, this.edgeAttributes(label, this.edgeMetadata(answerIndex, constraint)));
                }
            });
    }

    // put_assigned(answerIndex: number, constraint: DataConstraint?): void {
    //     let label = "assign[" + var_name + "]";
    //     let attributes = this.edgeAttributes(label, this.edgeMetadata(answerIndex, edge));
    //     this.maybeCreateEdge(edge, expr_or_func.vertex_map_key, vertexMapKey(assigned), "assigned", attributes);
    // }
    //
    // put_argument(answerIndex: number, constraint: DataConstraint?): void {
    //     const label = `arg[${var_name}]`;
    //     const attributes = this.edgeAttributes(label, this.edgeMetadata(answerIndex, edge));
    //     let from_vertex_key = null;
    //     switch (argument.kind) {
    //         case "value": {
    //             from_vertex_key = vertexMapKey(argument);
    //             break;
    //         }
    //         case "attribute": {
    //             from_vertex_key = vertexMapKey(argument);
    //             break;
    //         }
    //     }
    //     this.maybeCreateEdge(edge, from_vertex_key, expr_or_func.vertex_map_key, "argument", attributes);
    // }

    private shouldCreateNode(vertex: DataVertex, queryVertex: QueryVertex) {
        return shouldCreateNode(queryVertex);
    }

    private shouldCreateEdge(edge: DataConstraintAny, from: QueryVertex, to: QueryVertex) {
        return shouldCreateEdge(edge.queryConstraint, from, to);
    }

    private createEdge(edgeKey: string, from: DataVertex, to: DataVertex, attributes: EdgeAttributes) {
        if (!this.graph.hasDirectedEdge(edgeKey)) {
            // TODO: If there is an edge between the two vertices, make it curved
            if (this.graph.hasDirectedEdge(from, to)) {
                attributes.type = "curved";
            }
            this.graph.addDirectedEdgeWithKey(edgeKey, from, to, attributes);
        }
    }
}

export function shouldCreateNode(vertex: QueryVertex) {
    return !["unavailableVariable", "label"].includes(vertex.kind);
}

export function shouldCreateEdge(_edge: QueryConstraintAny, from: QueryVertex, to: QueryVertex) {
    return shouldCreateNode(from) && shouldCreateNode(to);
}

export function vertexMapKey(vertex: DataVertex): string {
    switch (vertex.kind) {
        case "attribute":
            return `${vertex.type.label}:${vertex.value}`;
        case "entity":
        case "relation":
            return vertex.iid;
        case "attributeType":
        case "entityType":
        case "relationType":
        case "roleType":
            return vertex.label;
        case "value":
            return `${vertex.valueType}:${vertex.value}`;
        case "expression":
        case "functionCall":
            return vertex.vertex_map_key;
        case "unavailable":
            return `unavailable[${vertex.variable}][${vertex.answerIndex}]`;
        default:
            throw `Unexpected vertex type: ${vertex}`;
    }
}
