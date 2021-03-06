module.exports = {
  prependFileNameToken,
  relocateErrors,
  findAbiMethod,
  argsToOpts
};

//

function prependFileNameToken(file) {
  return "\n//File: " + file + "\n";
}

// Find the original file (before bundling) that originated every one of the errors found

function relocateErrors(bundledContractSrc, errors) {
  var lines = bundledContractSrc.split("\n");
  if (!bundledContractSrc || !errors || !errors.length) return [];

  errors.forEach((error, idx) => {
    var rErrPos = new RegExp(":([0-9]+):([0-9]+):");
    var errPos = rErrPos.exec(error);
    var lineNum = errPos ? parseInt(errPos[1]) - 1 : -1;
    var offset = 1;
    var filePattern = new RegExp("//File: (.*)", "");
    var fileInfo;

    while (offset <= lineNum) {
      fileInfo = filePattern.exec(lines[lineNum - offset]);
      if (fileInfo) {
        errors[idx] = error.replace(
          rErrPos,
          fileInfo[1] + " :" + offset + ":" + errPos[2] + ":"
        );
        break;
      }
      offset++;
    }
  });
  return errors;
}

// Wrapper utils

function argsToOpts(_args, inputs) {
  const norm = str => {
    return str[0] == "_" ? str.substring(1) : str;
  };

  let args = _args.slice();
  let opts = {};
  if (typeof args[args.length - 1] === "function") {
    opts.$cb = args.pop();
  }

  for (
    let i = 0;
    args.length > 0 && !isObject(args[0]) && i < inputs.length;
    i++
  ) {
    opts[norm(inputs[i].name)] = args.shift();
  }
  while (args.length > 0) {
    const o = args.shift();
    if (!isObject(o)) return null;
    let isOld = false;
    if (o.from) {
      opts.$from = o.from;
      isOld = true;
    }
    if (o.to) {
      opts.$to = o.to;
      isOld = true;
    }
    if (o.gasPrice) {
      opts.$gasPrice = o.gasPrice;
      isOld = true;
    }
    if (o.gas) {
      opts.$gas = o.gas;
      isOld = true;
    }
    if (o.value) {
      opts.$value = o.value;
      isOld = true;
    }
    if (o.nonce) {
      opts.$nonce = o.nonce;
      isOld = true;
    }
    if (!isOld) {
      opts = Object.assign(opts, o);
    }
  }
  return opts;
}

function findAbiMethod(abi, method, opts = {}) {
  return abi.find(({ name, inputs }) => {
    if (name !== method) return false;
    const paramNames = inputs.map(param => {
      if (param.name[0] === "_") {
        return param.name.substring(1);
      }
      return param.name;
    });
    for (let i = 0; i < paramNames.length; i += 1) {
      if (typeof opts[paramNames[i]] === "undefined") {
        throw new Error("Param " + paramNames[i] + " not found.");
      }
    }
    return true;
  });
}

function isObject(o) {
  return (
    typeof o == "object" &&
    Object.keys(o)
      .sort()
      .join("") != "ces" &&
    !(o instanceof Array)
  );
}
