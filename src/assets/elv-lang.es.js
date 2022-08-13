class Scope {
  constructor(objects = {}, parent = null) {
    this.parent = parent;
    this.objects = objects;
    this.fn = false;
    this.earlyReturn = false;
  }
  setFunction() {
    this.fn = true;
  }
  isInFunctionScope() {
    if (this.fn)
      return true;
    if (!this.parent)
      return false;
    return this.parent.isInFunctionScope();
  }
  setEarlyReturn() {
    this.earlyReturn = true;
    if (!this.fn)
      this.parent.setEarlyReturn();
  }
  add(key, value) {
    if (key in this.objects)
      throw new SyntaxError(`${key} is already declared`);
    this.objects[key] = value;
    return value;
  }
  modify(key, value) {
    this.findScope(key).objects[key] = value;
  }
  get(key) {
    return this.findScope(key).objects[key];
  }
  findScope(key) {
    if (key in this.objects)
      return this;
    if (!this.parent)
      throw new ReferenceError(`${key} is not present in scope chain. Did you forget to declare?`);
    return this.parent.findScope(key);
  }
}
const GlobalScope = () => new Scope({
  print(...args2) {
    console.log(...args2);
  }
});
function string$1(node, _scope) {
  return node.value;
}
function num(node) {
  return node.value;
}
class Nil {
  toString() {
    return "nil";
  }
}
const nilObj = new Nil();
Object.preventExtensions(nilObj);
const nilProxyHandler = {
  get(target, prop, _receiver) {
    if (target[prop])
      return target[prop]();
    throw new ReferenceError("Cannot read properties of nil");
  },
  set() {
    throw new ReferenceError("Cannot set properties to nil");
  }
};
const nilProxy = new Proxy(nilObj, nilProxyHandler);
Object.preventExtensions(nilProxy);
function isNil(val) {
  return typeof val === "object" && val instanceof Nil;
}
function nil$1(_node, _scope) {
  return nilProxy;
}
function bool(node) {
  return node.value;
}
function program(node, scope) {
  let result = nil$1();
  for (let i = 0; i < node.body.length; i++) {
    result = elv(node.body[i], scope);
  }
  return result;
}
function expression$1(node, scope) {
  return elv(node.expression, scope);
}
let varIndex = 0;
let decs = [];
let decsLength = 0;
function variable$1(node, scope) {
  decs = node.declarations;
  decsLength = decs.length;
  for (varIndex = 0; varIndex < decsLength; varIndex++) {
    scope.add(
      decs[varIndex].id.name,
      elv(decs[decsLength - 1].init, scope)
    );
  }
  return nil$1();
}
function id$1(node, scope) {
  return scope.get(node.name);
}
const add = (a, b) => a + b;
const sub = (a, b) => a - b;
const mul = (a, b) => a * b;
const div = (a, b) => a / b;
const great = (a, b) => a > b;
const less = (a, b) => a < b;
const equal$1 = (a, b) => a === b;
const greatEqual = (a, b) => a >= b;
const lessEqual = (a, b) => a <= b;
const notEqual = (a, b) => !(a === b);
const and$1 = (a, b) => a && b;
const or$1 = (a, b) => a || b;
const operators$1 = {
  "+": add,
  "-": sub,
  "*": mul,
  "/": div,
  ">": great,
  "<": less,
  "==": equal$1,
  ">=": greatEqual,
  "<=": lessEqual,
  "!=": notEqual,
  "&": and$1,
  "|": or$1
};
function binary$1(node, scope) {
  if (!node.operator in operators$1) {
    throw new SyntaxError(`${node.operator} is not a valid operator`);
  }
  return operators$1[node.operator](elv(node.left, scope), elv(node.right, scope));
}
function blockRun(body, scope) {
  let res;
  for (let i = 0; i < body.length; i++) {
    res = elv(body[i], scope);
    if (scope.earlyReturn)
      return res;
  }
  return res != null ? res : nil$1();
}
function block$1(node, scope) {
  const blockScope = new Scope({}, scope);
  return blockRun(node.body, blockScope);
}
function ifElse$1(node, scope) {
  let res;
  if (elv(node.condition, scope)) {
    res = block$1(node.truthy, scope);
  } else if (node.falsy) {
    res = block$1(node.falsy, scope);
  }
  return res != null ? res : nil$1();
}
const minus = (a) => -a;
const not = (a) => {
  if (typeof a === "boolean") {
    return !a;
  }
  throw new TypeError(`Cannot invert ${a}. Can invert only booleans`);
};
const operators = {
  "-": minus,
  "!": not
};
function unary$1(node, scope) {
  if (!node.operator in operators) {
    throw new SyntaxError(`${node.operator} is not a valid operator`);
  }
  return operators[node.operator](elv(node.argument, scope));
}
function call$1(node, scope) {
  const fn = elv(node.callee, scope);
  const args2 = node.arguments.map((arg) => elv(arg, scope));
  if (typeof fn === "function") {
    return fn(...args2);
  }
  const objs = {};
  const parentScope = fn.scope;
  fn.params.forEach((param, i) => objs[param.name] = args2[i]);
  const fnScope = new Scope(objs, parentScope);
  fnScope.setFunction();
  return blockRun(fn.body.body, fnScope);
}
function def$1(node, scope) {
  scope.add(node.name.name, {
    params: node.args,
    scope,
    body: node.body
  });
  return nil$1();
}
function ret$1(node, scope) {
  if (!scope.isInFunctionScope())
    throw new SyntaxError("ret should be inside function scope");
  if (!node.argument)
    return nil$1();
  scope.setEarlyReturn();
  return elv(node.argument, scope);
}
function isCondition(node, scope) {
  return node.condition ? elv(node.condition, scope) : true;
}
function loop(node, scope) {
  const loopScope = new Scope({}, scope);
  if (node.init)
    elv(node.init, loopScope);
  let result;
  while (isCondition(node, loopScope)) {
    result = blockRun(node.body.body, loopScope);
    if (node.update)
      elv(node.update, loopScope);
    if (!isCondition(node, loopScope))
      break;
  }
  return result;
}
function assign(node, scope) {
  scope.modify(node.left.name, elv(node.right, scope));
}
const resolver = {
  program,
  empty: nil$1,
  expression: expression$1,
  string: string$1,
  int: num,
  float: num,
  nil: nil$1,
  boolean: bool,
  varInit: variable$1,
  id: id$1,
  binary: binary$1,
  logical: binary$1,
  unary: unary$1,
  def: def$1,
  call: call$1,
  ret: ret$1,
  block: block$1,
  if: ifElse$1,
  for: loop,
  assign
};
function resolve(node, scope) {
  if (!resolver[node.type])
    throw `Not Implemented: ${JSON.stringify(node)}`;
  return resolver[node.type](node, scope);
}
function elv(node, scope = GlobalScope()) {
  return resolve(node, scope);
}
function consume(store, type) {
  const token = store.next;
  if (token === null) {
    throw new SyntaxError(`Unexpected end of input, expected: "${type}"`);
  }
  if (store.next.type !== type) {
    throw new SyntaxError(`Unexpected token: "${token.value}", expected: "${type}"`);
  }
  store.next = store.lexer.getNext();
  return token;
}
function block(store) {
  consume(store, "[");
  const body = store.next.type !== "]" ? statements(store, "]") : [];
  consume(store, "]");
  return {
    type: "block",
    body
  };
}
function id(store) {
  const name = consume(store, "id").value;
  return {
    type: "id",
    name
  };
}
function def(store) {
  consume(store, "def");
  const name = id(store);
  consume(store, "(");
  const args2 = [];
  if (store.next.type !== ")") {
    do {
      args2.push(id(store));
    } while (store.next.type === "," && consume(store, ","));
  }
  consume(store, ")");
  const body = block(store);
  return {
    type: "def",
    name,
    args: args2,
    body
  };
}
function empty(store) {
  consume(store, ";");
  return {
    type: "empty"
  };
}
function and(store) {
  return logical(store, "equal", "&");
}
function relational(store) {
  return binary(store, "sum", "rel");
}
function sum(store) {
  return binary(store, "times", "sum");
}
function times(store) {
  return binary(store, "unary", "times");
}
function args(store) {
  const argumentList = [];
  do {
    argumentList.push(assignment(store));
  } while (store.next.type === "," && consume(store, ","));
  return argumentList;
}
function call(store, callee) {
  consume(store, "(");
  const argumentList = store.next.type !== ")" ? args(store) : [];
  consume(store, ")");
  let callExpression = {
    type: "call",
    callee,
    arguments: argumentList
  };
  if (store.next.type === "(") {
    callExpression = call(store, callExpression);
  }
  return callExpression;
}
function boolean(store, value) {
  consume(store, store.next.type);
  return {
    type: "boolean",
    value
  };
}
function nil(store) {
  consume(store, store.next.type);
  return {
    type: "nil",
    value: null
  };
}
function number(store) {
  const token = consume(store, store.next.type);
  return {
    type: token.type,
    value: Number(token.value)
  };
}
function string(store) {
  const token = consume(store, "string");
  return {
    type: "string",
    value: token.value.slice(1, -1)
  };
}
const primitives = {
  int: true,
  float: true,
  string: true,
  true: true,
  false: true,
  nil: true
};
function primitive(store) {
  switch (store.next.type) {
    case "int":
    case "float":
      return number(store);
    case "string":
      return string(store);
    case "true":
      return boolean(store, true);
    case "false":
      return boolean(store, false);
    case "nil":
      return nil(store);
  }
  throw new SyntaxError(`unexpected primitive: "${store.next.type}"`);
}
function isPrimitive(type) {
  return !!primitives[type];
}
function paranthesize(store) {
  consume(store, "(");
  const exp = expression(store);
  consume(store, ")");
  return exp;
}
function isPrimary(store) {
  return store.next.type === "(" || store.next.type === "id";
}
function primary(store) {
  if (isPrimitive(store.next.type)) {
    return primitive(store);
  }
  if (!isPrimary(store))
    throw new SyntaxError(`Unexpected token: "${store.next.type}"`);
  switch (store.next.type) {
    case "(":
      return paranthesize(store);
    case "id":
      return id(store);
    default:
      return primitiveOrCall(store);
  }
}
function primitiveOrCall(store) {
  const primitive2 = primary(store);
  if (store.next.type === "(") {
    return call(store, primitive2);
  }
  return primitive2;
}
function unary(store) {
  let operator = null;
  switch (store.next.type) {
    case "sum":
      operator = consume(store, "sum").value;
      break;
    case "!":
      operator = consume(store, "!").value;
      break;
  }
  if (operator !== null) {
    return {
      type: "unary",
      operator,
      argument: unary(store)
    };
  }
  return primitiveOrCall(store);
}
const binaryExpressions = {
  sum,
  relational,
  times,
  unary
};
function binary(store, builderName, operatorToken) {
  let left = binaryExpressions[builderName](store);
  while (store.next.type === operatorToken) {
    const operator = consume(store, operatorToken).value;
    const right = binaryExpressions[builderName](store);
    left = {
      type: "binary",
      operator,
      left,
      right
    };
  }
  return left;
}
function equal(store) {
  return binary(store, "relational", "==");
}
const logicalExpressions = {
  and,
  equal
};
function logical(store, logicalOperator, operatorToken) {
  let left = logicalExpressions[logicalOperator](store);
  while (store.next.type === operatorToken) {
    const operator = consume(store, operatorToken).value;
    const right = logicalExpressions[logicalOperator](store);
    left = {
      type: "logical",
      operator,
      left,
      right
    };
  }
  return left;
}
function or(store) {
  return logical(store, "and", "|");
}
function assignment(store) {
  const left = or(store);
  if (store.next.type !== "=") {
    return left;
  }
  if (left.type !== "id")
    throw new SyntaxError("Invalid left-hand side in assignment");
  const token = consume(store, "=");
  return {
    type: "assign",
    operator: token.value,
    left,
    right: assignment(store)
  };
}
function expression(store) {
  return assignment(store);
}
function vars(store) {
  const name = id(store);
  const init = store.next.type !== ";" && store.next.type !== "," ? consume(store, "=") && assignment(store) : null;
  return {
    type: "var",
    id: name,
    init
  };
}
function variable(store, consumeSemiColon = true) {
  consume(store, "var");
  const declarations = [];
  do {
    declarations.push(vars(store));
  } while (store.next.type === "," && consume(store, ","));
  if (consumeSemiColon)
    consume(store, ";");
  return {
    type: "varInit",
    declarations
  };
}
function forInit(store) {
  if (store.next.type === "var")
    return variable(store, false);
  return expression(store);
}
function forLoop(store) {
  consume(store, "for");
  consume(store, "(");
  const init = store.next.type === ";" ? null : forInit(store);
  consume(store, ";");
  const condition = store.next.type === ";" ? null : expression(store);
  consume(store, ";");
  const update = store.next.type === ")" ? null : expression(store);
  consume(store, ")");
  const body = statement(store);
  return {
    type: "for",
    init,
    condition,
    update,
    body
  };
}
function ifElse(store) {
  var _a;
  consume(store, "if");
  consume(store, "(");
  const condition = expression(store);
  consume(store, ")");
  const truthy = block(store);
  const falsy = ((_a = store.next) == null ? void 0 : _a.type) === "else" ? consume(store, "else") && block(store) : null;
  return {
    type: "if",
    condition,
    truthy,
    falsy
  };
}
function ret(store) {
  consume(store, "ret");
  const argument = store.next.type !== ";" ? expression(store) : null;
  consume(store, ";");
  return {
    type: "ret",
    argument
  };
}
function statement(store) {
  switch (store.next.value) {
    case ";":
      return empty(store);
    case "[":
      return block(store);
    case "if":
      return ifElse(store);
    case "var":
      return variable(store);
    case "for":
      return forLoop(store);
    case "def":
      return def(store);
    case "ret":
      return ret(store);
    default:
      const exp = expression(store);
      consume(store, ";");
      return {
        type: "expression",
        expression: exp
      };
  }
}
function statements(store, nextType = null) {
  const statementList = [];
  while (store.next !== null && store.next.type !== nextType) {
    statementList.push(statement(store));
  }
  return statementList;
}
const Spec = [
  [/^\s+/, null],
  [/^#/, null],
  [/^##[\s\S]#/, null],
  [/^;/, ";"],
  [/^\(/, "("],
  [/^\)/, ")"],
  [/^\,/, ","],
  [/^\[/, "["],
  [/^\]/, "]"],
  [/^\btrue\b/, "true"],
  [/^\bfalse\b/, "false"],
  [/^\bnil\b/, "nil"],
  [/^\bif\b/, "if"],
  [/^\belse\b/, "else"],
  [/^\bvar\b/, "var"],
  [/^\bfor\b/, "for"],
  [/^\bdef\b/, "def"],
  [/^\bret\b/, "ret"],
  [/^\d+\.\d+/, "float"],
  [/^\d+/, "int"],
  [/^\w+/, "id"],
  [/^[=!]=/, "=="],
  [/^=/, "="],
  [/^[+\-]/, "sum"],
  [/^[*\/]/, "times"],
  [/^[<>]=?/, "rel"],
  [/^&/, "&"],
  [/^\|/, "|"],
  [/^!/, "!"],
  [/^\{/, "{"],
  [/^\}/, "}"],
  [/^"[^"]*"/, "string"]
];
class Lexer {
  init(string2) {
    this.string = string2;
    this.cursor = 0;
  }
  isReachedEnd() {
    return this.cursor === this.string.length;
  }
  match(regex, string2) {
    const matched = regex.exec(string2);
    if (matched === null)
      return null;
    this.cursor += matched[0].length;
    return matched[0];
  }
  getNext() {
    if (this.isReachedEnd())
      return null;
    const string2 = this.string.slice(this.cursor);
    for (const [regex, specType] of Spec) {
      const value = this.match(regex, string2);
      if (value === null)
        continue;
      if (specType === null)
        return this.getNext();
      return {
        type: specType,
        value
      };
    }
    throw new SyntaxError(`Not a valid token: "${string2[0]}"`);
  }
}
class Store {
  constructor(string2) {
    this.lexer = new Lexer();
    this.string = string2;
    this.lexer.init(string2);
    this.next = this.lexer.getNext();
  }
}
function parse(program2) {
  const store = new Store(program2);
  return {
    type: "program",
    body: statements(store)
  };
}
export { Scope, elv, isNil, parse as parser };
