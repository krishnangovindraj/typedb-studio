import MultiGraph from "graphology";
import Sigma from "sigma";

import {
  Attribute,
  AttributeType,
  Concept,
  Entity,
  EntityType,
  InstantiableType,
  Relation,
  RelationType,
  RoleType,
  Value
} from "../typedb-driver/concept";
import { QueryEdge, QueryVertex } from "../typedb-driver/query-structure";
import {
  DataGraph,
  DataVertex,
  SpecialVertexKind,
  QueryCoordinates,
  VertexExpression,
  VertexFunction,
  VertexUnavailable,
  DataConstraintAny,
  DataConstraintLinks,
  DataConstraintHas,
  DataConstraintIsa,
  DataConstraintOwns,
  DataConstraintRelates,
  DataConstraintPlays,
  DataConstraintSub,
  DataConstraintFunction,
  DataConstraintExpression
} from "./graph";

/////////////////////////////////
// Logical Graph -> Graphology //
/////////////////////////////////

/**
 * You will majorly need:
 *  graph.addNode(id, attributes)
 *  graph.addNode(from, to,  attributes)
 * See: https://www.sigmajs.org/docs/advanced/data/ for attributes
 */
export interface ILogicalGraphConverter {
  // TODO: Functional vertices & edges like expressions, comparisons & function calls

  // Vertices
  put_vertex(answer_index: number, vertex: DataVertex, queryVertex: QueryVertex): void;

  // Edges
  put_isa(answer_index: number, constraint: DataConstraintIsa, thing: Entity | Relation | Attribute | VertexUnavailable, type: InstantiableType | VertexUnavailable): void;

  put_has(answer_index: number, constraint: DataConstraintHas, owner: Entity | Relation | VertexUnavailable, attribute: Attribute | VertexUnavailable): void;

  put_links(answer_index: number, constraint: DataConstraintLinks, relation: Relation | VertexUnavailable, player: Entity | Relation | VertexUnavailable, role: RoleType | VertexUnavailable): void;

  put_sub(answer_index: number, constraint: DataConstraintSub, subtype: EntityType | RelationType | AttributeType | RoleType |VertexUnavailable, supertype: EntityType | RelationType | AttributeType | RoleType | VertexUnavailable): void;

  put_owns(answer_index: number, constraint: DataConstraintOwns, owner: EntityType | RelationType | VertexUnavailable, attribute: AttributeType | VertexUnavailable): void;

  put_relates(answer_index: number, constraint: DataConstraintRelates, relation: RelationType | VertexUnavailable, role: RoleType | VertexUnavailable): void;

  put_plays(answer_index: number, constraint: DataConstraintPlays, player: EntityType | RelationType | VertexUnavailable, role: RoleType | VertexUnavailable): void;

  put_isa_exact(answer_index: number, constraint: DataConstraintIsa, thing: Entity | Relation | Attribute | VertexUnavailable, type: EntityType | RelationType | AttributeType | VertexUnavailable): void;

  put_sub_exact(answer_index: number, constraint: DataConstraintSub, subtype: EntityType | RelationType | AttributeType | VertexUnavailable, supertype: EntityType | RelationType | AttributeType | VertexUnavailable): void;

  put_expression(answer_index: number, constraint: DataConstraintExpression, assigned: { data: (Value | VertexUnavailable), variable: string }, args: { data: (Value | Attribute | VertexUnavailable), variable: string }[]): void;

  put_function(answer_index: number, constraint: DataConstraintFunction, assigned: { data: (Entity | Relation | Attribute | Value | VertexUnavailable), variable: string }, args: { data: (Entity | Relation | Attribute | Value | VertexUnavailable), variable: string }[]): void;
}

export function convertLogicalGraphWith(dataGraph: DataGraph, converter: ILogicalGraphConverter) {
    dataGraph.answers.forEach((edgeList, answerIndex) => {
        edgeList.forEach(edge => {
            putConstraint(converter, answerIndex, edge, dataGraph);
        });
    });
}

function putConstraint(converter: ILogicalGraphConverter, answer_index: number, constraint: DataConstraintAny, logicalGraph: DataGraph) {
  switch (constraint.kind) {
    case "isa":{
      converter.put_isa(answer_index, constraint);
      break;
    }
    case "has": {
      let inner = constraint.constraint;
      converter.put_has(answer_index, constraint);
      break;
    }
    case "links": {
      let inner = constraint.constraint;
      converter.put_links(answer_index, constraint);
      break;
    }
    case "sub": {
      let inner = constraint.constraint;
      converter.put_sub(answer_index, constraint);
      break;
    }
    case "owns": {
      let inner = constraint.constraint;
      converter.put_owns(answer_index, constraint);
      break;
    }
    case "relates": {
      converter.put_relates(answer_index, constraint);
      break;
    }
    case "plays": {
      converter.put_plays(answer_index, constraint);
      break;
    }
    case "expression" : {
      converter.put_expression(answer_index, constraint);
      break;
    }
    case "function" : {
      converter.put_function(answer_index, constraint);
      break;
    }
    default: {
      throw new Error();
    }
  }
}
