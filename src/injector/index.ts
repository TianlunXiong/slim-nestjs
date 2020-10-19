const injectableClassSet = new Set<Function>();

function Injectable(_constructor: Function) {
  if (injectableClassSet.has(_constructor)) {
    return;
  } else {
    injectableClassSet.add(_constructor);
  }
}

export { Injectable, injectableClassSet };
