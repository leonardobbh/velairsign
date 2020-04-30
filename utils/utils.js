function hexStringToUint8Array(hexString){
    if (hexString.length % 2 !== 0){
        throw "Invalid hexString";
    }
    var arrayBuffer = new Uint8Array(hexString.length / 2);

    for (var i = 0; i < hexString.length; i += 2) {
        var byteValue = parseInt(hexString.substr(i, 2), 16);
        if (isNaN(byteValue)){
        throw "Invalid hexString";
        }
        arrayBuffer[i/2] = byteValue;
    }

    return arrayBuffer;
}

exports.hexStringToUint8Array = hexStringToUint8Array;