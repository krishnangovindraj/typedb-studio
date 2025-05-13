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
  put_isa(answer_index: number, constraint: DataConstraintIsa): void;

  put_has(answer_index: number, constraint: DataConstraintHas): void;

  put_links(answer_index: number, constraint: DataConstraintLinks): void;

  put_sub(answer_index: number, constraint: DataConstraintSub): void;

  put_owns(answer_index: number, constraint: DataConstraintOwns): void;

  put_relates(answer_index: number, constraint: DataConstraintRelates): void;

  put_plays(answer_index: number, constraint: DataConstraintPlays): void;

  put_expression(answer_index: number, constraint: DataConstraintExpression): void;

  put_function(answer_index: number, constraint: DataConstraintFunction): void;
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
