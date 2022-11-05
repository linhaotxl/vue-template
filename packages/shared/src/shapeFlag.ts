export const enum ShapeFlags {
  ELEMENT = 1,
  ARRAY_CHILDREN = 1 << 1,
  STATEFUL_COMPONENT = 1 << 2,
  SLOTS_CHILDREN = 1 << 3,
  TEXT_CHILDREN = 1 << 4,
  FUNCTIONAL_COMPONENT = 1 << 5,
  COMPONENT = 1 << 6,
}
