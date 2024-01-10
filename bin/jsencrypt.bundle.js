const BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
function int2char(n) {
    return BI_RM.charAt(n);
}
function op_and(x, y) {
    return x & y;
}
function op_or(x, y) {
    return x | y;
}
function op_xor(x, y) {
    return x ^ y;
}
function op_andnot(x, y) {
    return x & ~y;
}
function lbit(x) {
    if (x == 0) {
        return -1;
    }
    let r = 0;
    if ((x & 0xffff) == 0) {
        x >>= 16;
        r += 16;
    }
    if ((x & 0xff) == 0) {
        x >>= 8;
        r += 8;
    }
    if ((x & 0xf) == 0) {
        x >>= 4;
        r += 4;
    }
    if ((x & 3) == 0) {
        x >>= 2;
        r += 2;
    }
    if ((x & 1) == 0) {
        ++r;
    }
    return r;
}
function cbit(x) {
    let r = 0;
    while(x != 0){
        x &= x - 1;
        ++r;
    }
    return r;
}
const b64map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const b64pad = "=";
function hex2b64(h) {
    let i;
    let c;
    let ret = "";
    for(i = 0; i + 3 <= h.length; i += 3){
        c = parseInt(h.substring(i, i + 3), 16);
        ret += b64map.charAt(c >> 6) + b64map.charAt(c & 63);
    }
    if (i + 1 == h.length) {
        c = parseInt(h.substring(i, i + 1), 16);
        ret += b64map.charAt(c << 2);
    } else if (i + 2 == h.length) {
        c = parseInt(h.substring(i, i + 2), 16);
        ret += b64map.charAt(c >> 2) + b64map.charAt((c & 3) << 4);
    }
    while((ret.length & 3) > 0){
        ret += b64pad;
    }
    return ret;
}
function b64tohex(s) {
    let ret = "";
    let i;
    let k = 0;
    let slop = 0;
    for(i = 0; i < s.length; ++i){
        if (s.charAt(i) == b64pad) {
            break;
        }
        const v = b64map.indexOf(s.charAt(i));
        if (v < 0) {
            continue;
        }
        if (k == 0) {
            ret += int2char(v >> 2);
            slop = v & 3;
            k = 1;
        } else if (k == 1) {
            ret += int2char(slop << 2 | v >> 4);
            slop = v & 0xf;
            k = 2;
        } else if (k == 2) {
            ret += int2char(slop);
            ret += int2char(v >> 2);
            slop = v & 3;
            k = 3;
        } else {
            ret += int2char(slop << 2 | v >> 4);
            ret += int2char(v & 0xf);
            k = 0;
        }
    }
    if (k == 1) {
        ret += int2char(slop << 2);
    }
    return ret;
}
let decoder;
const Hex = {
    decode (a) {
        let i;
        if (decoder === undefined) {
            let hex = "0123456789ABCDEF";
            const ignore = " \f\n\r\t\u00A0\u2028\u2029";
            decoder = {};
            for(i = 0; i < 16; ++i){
                decoder[hex.charAt(i)] = i;
            }
            hex = hex.toLowerCase();
            for(i = 10; i < 16; ++i){
                decoder[hex.charAt(i)] = i;
            }
            for(i = 0; i < ignore.length; ++i){
                decoder[ignore.charAt(i)] = -1;
            }
        }
        const out = [];
        let bits = 0;
        let char_count = 0;
        for(i = 0; i < a.length; ++i){
            let c = a.charAt(i);
            if (c == "=") {
                break;
            }
            c = decoder[c];
            if (c == -1) {
                continue;
            }
            if (c === undefined) {
                throw new Error("Illegal character at offset " + i);
            }
            bits |= c;
            if (++char_count >= 2) {
                out[out.length] = bits;
                bits = 0;
                char_count = 0;
            } else {
                bits <<= 4;
            }
        }
        if (char_count) {
            throw new Error("Hex encoding incomplete: 4 bits missing");
        }
        return out;
    }
};
let decoder1;
const Base64 = {
    decode (a) {
        let i;
        if (decoder1 === undefined) {
            const b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
            const ignore = "= \f\n\r\t\u00A0\u2028\u2029";
            decoder1 = Object.create(null);
            for(i = 0; i < 64; ++i){
                decoder1[b64.charAt(i)] = i;
            }
            decoder1['-'] = 62;
            decoder1['_'] = 63;
            for(i = 0; i < ignore.length; ++i){
                decoder1[ignore.charAt(i)] = -1;
            }
        }
        const out = [];
        let bits = 0;
        let char_count = 0;
        for(i = 0; i < a.length; ++i){
            let c = a.charAt(i);
            if (c == "=") {
                break;
            }
            c = decoder1[c];
            if (c == -1) {
                continue;
            }
            if (c === undefined) {
                throw new Error("Illegal character at offset " + i);
            }
            bits |= c;
            if (++char_count >= 4) {
                out[out.length] = bits >> 16;
                out[out.length] = bits >> 8 & 0xFF;
                out[out.length] = bits & 0xFF;
                bits = 0;
                char_count = 0;
            } else {
                bits <<= 6;
            }
        }
        switch(char_count){
            case 1:
                throw new Error("Base64 encoding incomplete: at least 2 bits missing");
            case 2:
                out[out.length] = bits >> 10;
                break;
            case 3:
                out[out.length] = bits >> 16;
                out[out.length] = bits >> 8 & 0xFF;
                break;
        }
        return out;
    },
    re: /-----BEGIN [^-]+-----([A-Za-z0-9+\/=\s]+)-----END [^-]+-----|begin-base64[^\n]+\n([A-Za-z0-9+\/=\s]+)====/,
    unarmor (a) {
        const m = Base64.re.exec(a);
        if (m) {
            if (m[1]) {
                a = m[1];
            } else if (m[2]) {
                a = m[2];
            } else {
                throw new Error("RegExp out of sync");
            }
        }
        return Base64.decode(a);
    }
};
const max = 10000000000000;
class Int10 {
    constructor(value){
        this.buf = [
            +value || 0
        ];
    }
    mulAdd(m, c) {
        const b = this.buf;
        const l = b.length;
        let i;
        let t;
        for(i = 0; i < l; ++i){
            t = b[i] * m + c;
            if (t < 10000000000000) {
                c = 0;
            } else {
                c = 0 | t / max;
                t -= c * max;
            }
            b[i] = t;
        }
        if (c > 0) {
            b[i] = c;
        }
    }
    sub(c) {
        const b = this.buf;
        const l = b.length;
        let i;
        let t;
        for(i = 0; i < l; ++i){
            t = b[i] - c;
            if (t < 0) {
                t += max;
                c = 1;
            } else {
                c = 0;
            }
            b[i] = t;
        }
        while(b[b.length - 1] === 0){
            b.pop();
        }
    }
    toString(base) {
        if ((base || 10) != 10) {
            throw new Error("only base 10 is supported");
        }
        const b = this.buf;
        let s = b[b.length - 1].toString();
        for(let i = b.length - 2; i >= 0; --i){
            s += (max + b[i]).toString().substring(1);
        }
        return s;
    }
    valueOf() {
        const b = this.buf;
        let v = 0;
        for(let i = b.length - 1; i >= 0; --i){
            v = v * max + b[i];
        }
        return v;
    }
    simplify() {
        const b = this.buf;
        return b.length == 1 ? b[0] : this;
    }
    buf;
}
const ellipsis = "\u2026";
const reTimeS = /^(\d\d)(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])([01]\d|2[0-3])(?:([0-5]\d)(?:([0-5]\d)(?:[.,](\d{1,3}))?)?)?(Z|[-+](?:[0]\d|1[0-2])([0-5]\d)?)?$/;
const reTimeL = /^(\d\d\d\d)(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])([01]\d|2[0-3])(?:([0-5]\d)(?:([0-5]\d)(?:[.,](\d{1,3}))?)?)?(Z|[-+](?:[0]\d|1[0-2])([0-5]\d)?)?$/;
function stringCut(str, len) {
    if (str.length > len) {
        str = str.substring(0, len) + ellipsis;
    }
    return str;
}
class Stream {
    constructor(enc, pos){
        if (enc instanceof Stream) {
            this.enc = enc.enc;
            this.pos = enc.pos;
        } else {
            this.enc = enc;
            this.pos = pos;
        }
    }
    enc;
    pos;
    get(pos) {
        if (pos === undefined) {
            pos = this.pos++;
        }
        if (pos >= this.enc.length) {
            throw new Error(`Requesting byte offset ${pos} on a stream of length ${this.enc.length}`);
        }
        return "string" === typeof this.enc ? this.enc.charCodeAt(pos) : this.enc[pos];
    }
    hexDigits = "0123456789ABCDEF";
    hexByte(b) {
        return this.hexDigits.charAt(b >> 4 & 0xF) + this.hexDigits.charAt(b & 0xF);
    }
    hexDump(start, end, raw) {
        let s = "";
        for(let i = start; i < end; ++i){
            s += this.hexByte(this.get(i));
            if (raw !== true) {
                switch(i & 0xF){
                    case 0x7:
                        s += "  ";
                        break;
                    case 0xF:
                        s += "\n";
                        break;
                    default:
                        s += " ";
                }
            }
        }
        return s;
    }
    isASCII(start, end) {
        for(let i = start; i < end; ++i){
            const c = this.get(i);
            if (c < 32 || c > 176) {
                return false;
            }
        }
        return true;
    }
    parseStringISO(start, end) {
        let s = "";
        for(let i = start; i < end; ++i){
            s += String.fromCharCode(this.get(i));
        }
        return s;
    }
    parseStringUTF(start, end) {
        let s = "";
        for(let i = start; i < end;){
            const c = this.get(i++);
            if (c < 128) {
                s += String.fromCharCode(c);
            } else if (c > 191 && c < 224) {
                s += String.fromCharCode((c & 0x1F) << 6 | this.get(i++) & 0x3F);
            } else {
                s += String.fromCharCode((c & 0x0F) << 12 | (this.get(i++) & 0x3F) << 6 | this.get(i++) & 0x3F);
            }
        }
        return s;
    }
    parseStringBMP(start, end) {
        let str = "";
        let hi;
        let lo;
        for(let i = start; i < end;){
            hi = this.get(i++);
            lo = this.get(i++);
            str += String.fromCharCode(hi << 8 | lo);
        }
        return str;
    }
    parseTime(start, end, shortYear) {
        let s = this.parseStringISO(start, end);
        const m = (shortYear ? reTimeS : reTimeL).exec(s);
        if (!m) {
            return "Unrecognized time: " + s;
        }
        if (shortYear) {
            m[1] = +m[1];
            m[1] += +m[1] < 70 ? 2000 : 1900;
        }
        s = m[1] + "-" + m[2] + "-" + m[3] + " " + m[4];
        if (m[5]) {
            s += ":" + m[5];
            if (m[6]) {
                s += ":" + m[6];
                if (m[7]) {
                    s += "." + m[7];
                }
            }
        }
        if (m[8]) {
            s += " UTC";
            if (m[8] != "Z") {
                s += m[8];
                if (m[9]) {
                    s += ":" + m[9];
                }
            }
        }
        return s;
    }
    parseInteger(start, end) {
        let v = this.get(start);
        const neg = v > 127;
        const pad = neg ? 255 : 0;
        let len;
        let s = "";
        while(v == pad && ++start < end){
            v = this.get(start);
        }
        len = end - start;
        if (len === 0) {
            return neg ? -1 : 0;
        }
        if (len > 4) {
            s = v;
            len <<= 3;
            while(((+s ^ pad) & 0x80) == 0){
                s = +s << 1;
                --len;
            }
            s = "(" + len + " bit)\n";
        }
        if (neg) {
            v = v - 256;
        }
        const n = new Int10(v);
        for(let i = start + 1; i < end; ++i){
            n.mulAdd(256, this.get(i));
        }
        return s + n.toString();
    }
    parseBitString(start, end, maxLength) {
        const unusedBit = this.get(start);
        const lenBit = (end - start - 1 << 3) - unusedBit;
        const intro = "(" + lenBit + " bit)\n";
        let s = "";
        for(let i = start + 1; i < end; ++i){
            const b = this.get(i);
            const skip = i == end - 1 ? unusedBit : 0;
            for(let j = 7; j >= skip; --j){
                s += b >> j & 1 ? "1" : "0";
            }
            if (s.length > maxLength) {
                return intro + stringCut(s, maxLength);
            }
        }
        return intro + s;
    }
    parseOctetString(start, end, maxLength) {
        if (this.isASCII(start, end)) {
            return stringCut(this.parseStringISO(start, end), maxLength);
        }
        const len = end - start;
        let s = "(" + len + " byte)\n";
        maxLength /= 2;
        if (len > maxLength) {
            end = start + maxLength;
        }
        for(let i = start; i < end; ++i){
            s += this.hexByte(this.get(i));
        }
        if (len > maxLength) {
            s += ellipsis;
        }
        return s;
    }
    parseOID(start, end, maxLength) {
        let s = "";
        let n = new Int10();
        let bits = 0;
        for(let i = start; i < end; ++i){
            const v = this.get(i);
            n.mulAdd(128, v & 0x7F);
            bits += 7;
            if (!(v & 0x80)) {
                if (s === "") {
                    n = n.simplify();
                    if (n instanceof Int10) {
                        n.sub(80);
                        s = "2." + n.toString();
                    } else {
                        const m = n < 80 ? n < 40 ? 0 : 1 : 2;
                        s = m + "." + (n - m * 40);
                    }
                } else {
                    s += "." + n.toString();
                }
                if (s.length > maxLength) {
                    return stringCut(s, maxLength);
                }
                n = new Int10();
                bits = 0;
            }
        }
        if (bits > 0) {
            s += ".incomplete";
        }
        return s;
    }
}
class ASN1 {
    constructor(stream, header, length, tag, sub){
        if (!(tag instanceof ASN1Tag)) {
            throw new Error("Invalid tag value.");
        }
        this.stream = stream;
        this.header = header;
        this.length = length;
        this.tag = tag;
        this.sub = sub;
    }
    stream;
    header;
    length;
    tag;
    sub;
    typeName() {
        switch(this.tag.tagClass){
            case 0:
                switch(this.tag.tagNumber){
                    case 0x00:
                        return "EOC";
                    case 0x01:
                        return "BOOLEAN";
                    case 0x02:
                        return "INTEGER";
                    case 0x03:
                        return "BIT_STRING";
                    case 0x04:
                        return "OCTET_STRING";
                    case 0x05:
                        return "NULL";
                    case 0x06:
                        return "OBJECT_IDENTIFIER";
                    case 0x07:
                        return "ObjectDescriptor";
                    case 0x08:
                        return "EXTERNAL";
                    case 0x09:
                        return "REAL";
                    case 0x0A:
                        return "ENUMERATED";
                    case 0x0B:
                        return "EMBEDDED_PDV";
                    case 0x0C:
                        return "UTF8String";
                    case 0x10:
                        return "SEQUENCE";
                    case 0x11:
                        return "SET";
                    case 0x12:
                        return "NumericString";
                    case 0x13:
                        return "PrintableString";
                    case 0x14:
                        return "TeletexString";
                    case 0x15:
                        return "VideotexString";
                    case 0x16:
                        return "IA5String";
                    case 0x17:
                        return "UTCTime";
                    case 0x18:
                        return "GeneralizedTime";
                    case 0x19:
                        return "GraphicString";
                    case 0x1A:
                        return "VisibleString";
                    case 0x1B:
                        return "GeneralString";
                    case 0x1C:
                        return "UniversalString";
                    case 0x1E:
                        return "BMPString";
                }
                return "Universal_" + this.tag.tagNumber.toString();
            case 1:
                return "Application_" + this.tag.tagNumber.toString();
            case 2:
                return "[" + this.tag.tagNumber.toString() + "]";
            case 3:
                return "Private_" + this.tag.tagNumber.toString();
        }
    }
    content(maxLength) {
        if (this.tag === undefined) {
            return null;
        }
        if (maxLength === undefined) {
            maxLength = Infinity;
        }
        const content = this.posContent();
        const len = Math.abs(this.length);
        if (!this.tag.isUniversal()) {
            if (this.sub !== null) {
                return "(" + this.sub.length + " elem)";
            }
            return this.stream.parseOctetString(content, content + len, maxLength);
        }
        switch(this.tag.tagNumber){
            case 0x01:
                return this.stream.get(content) === 0 ? "false" : "true";
            case 0x02:
                return this.stream.parseInteger(content, content + len);
            case 0x03:
                return this.sub ? "(" + this.sub.length + " elem)" : this.stream.parseBitString(content, content + len, maxLength);
            case 0x04:
                return this.sub ? "(" + this.sub.length + " elem)" : this.stream.parseOctetString(content, content + len, maxLength);
            case 0x06:
                return this.stream.parseOID(content, content + len, maxLength);
            case 0x10:
            case 0x11:
                if (this.sub !== null) {
                    return "(" + this.sub.length + " elem)";
                } else {
                    return "(no elem)";
                }
            case 0x0C:
                return stringCut(this.stream.parseStringUTF(content, content + len), maxLength);
            case 0x12:
            case 0x13:
            case 0x14:
            case 0x15:
            case 0x16:
            case 0x1A:
                return stringCut(this.stream.parseStringISO(content, content + len), maxLength);
            case 0x1E:
                return stringCut(this.stream.parseStringBMP(content, content + len), maxLength);
            case 0x17:
            case 0x18:
                return this.stream.parseTime(content, content + len, this.tag.tagNumber == 0x17);
        }
        return null;
    }
    toString() {
        return this.typeName() + "@" + this.stream.pos + "[header:" + this.header + ",length:" + this.length + ",sub:" + (this.sub === null ? "null" : this.sub.length) + "]";
    }
    toPrettyString(indent) {
        if (indent === undefined) {
            indent = "";
        }
        let s = indent + this.typeName() + " @" + this.stream.pos;
        if (this.length >= 0) {
            s += "+";
        }
        s += this.length;
        if (this.tag.tagConstructed) {
            s += " (constructed)";
        } else if (this.tag.isUniversal() && (this.tag.tagNumber == 0x03 || this.tag.tagNumber == 0x04) && this.sub !== null) {
            s += " (encapsulates)";
        }
        s += "\n";
        if (this.sub !== null) {
            indent += "  ";
            for(let i = 0, max = this.sub.length; i < max; ++i){
                s += this.sub[i].toPrettyString(indent);
            }
        }
        return s;
    }
    posStart() {
        return this.stream.pos;
    }
    posContent() {
        return this.stream.pos + this.header;
    }
    posEnd() {
        return this.stream.pos + this.header + Math.abs(this.length);
    }
    toHexString() {
        return this.stream.hexDump(this.posStart(), this.posEnd(), true);
    }
    static decodeLength(stream) {
        let buf = stream.get();
        const len = buf & 0x7F;
        if (len == buf) {
            return len;
        }
        if (len > 6) {
            throw new Error("Length over 48 bits not supported at position " + (stream.pos - 1));
        }
        if (len === 0) {
            return null;
        }
        buf = 0;
        for(let i = 0; i < len; ++i){
            buf = buf * 256 + stream.get();
        }
        return buf;
    }
    getHexStringValue() {
        const hexString = this.toHexString();
        const offset = this.header * 2;
        const length = this.length * 2;
        return hexString.substr(offset, length);
    }
    static decode(str) {
        let stream;
        if (!(str instanceof Stream)) {
            stream = new Stream(str, 0);
        } else {
            stream = str;
        }
        const streamStart = new Stream(stream);
        const tag = new ASN1Tag(stream);
        let len = ASN1.decodeLength(stream);
        const start = stream.pos;
        const header = start - streamStart.pos;
        let sub = null;
        const getSub = function() {
            const ret = [];
            if (len !== null) {
                const end = start + len;
                while(stream.pos < end){
                    ret[ret.length] = ASN1.decode(stream);
                }
                if (stream.pos != end) {
                    throw new Error("Content size is not correct for container starting at offset " + start);
                }
            } else {
                try {
                    for(;;){
                        const s = ASN1.decode(stream);
                        if (s.tag.isEOC()) {
                            break;
                        }
                        ret[ret.length] = s;
                    }
                    len = start - stream.pos;
                } catch (e) {
                    throw new Error("Exception while decoding undefined length content: " + e);
                }
            }
            return ret;
        };
        if (tag.tagConstructed) {
            sub = getSub();
        } else if (tag.isUniversal() && (tag.tagNumber == 0x03 || tag.tagNumber == 0x04)) {
            try {
                if (tag.tagNumber == 0x03) {
                    if (stream.get() != 0) {
                        throw new Error("BIT STRINGs with unused bits cannot encapsulate.");
                    }
                }
                sub = getSub();
                for(let i = 0; i < sub.length; ++i){
                    if (sub[i].tag.isEOC()) {
                        throw new Error("EOC is not supposed to be actual content.");
                    }
                }
            } catch (e) {
                sub = null;
            }
        }
        if (sub === null) {
            if (len === null) {
                throw new Error("We can't skip over an invalid tag with undefined length at offset " + start);
            }
            stream.pos = start + Math.abs(len);
        }
        return new ASN1(streamStart, header, len, tag, sub);
    }
}
class ASN1Tag {
    constructor(stream){
        let buf = stream.get();
        this.tagClass = buf >> 6;
        this.tagConstructed = (buf & 0x20) !== 0;
        this.tagNumber = buf & 0x1F;
        if (this.tagNumber == 0x1F) {
            const n = new Int10();
            do {
                buf = stream.get();
                n.mulAdd(128, buf & 0x7F);
            }while (buf & 0x80)
            this.tagNumber = n.simplify();
        }
    }
    tagClass;
    tagConstructed;
    tagNumber;
    isUniversal() {
        return this.tagClass === 0x00;
    }
    isEOC() {
        return this.tagClass === 0x00 && this.tagNumber === 0x00;
    }
}
const __default = {
    ASN1,
    ASN1Tag,
    Stream
};
let dbits;
const j_lm = (0xdeadbeefcafe & 0xffffff) == 0xefcafe;
const lowprimes = [
    2,
    3,
    5,
    7,
    11,
    13,
    17,
    19,
    23,
    29,
    31,
    37,
    41,
    43,
    47,
    53,
    59,
    61,
    67,
    71,
    73,
    79,
    83,
    89,
    97,
    101,
    103,
    107,
    109,
    113,
    127,
    131,
    137,
    139,
    149,
    151,
    157,
    163,
    167,
    173,
    179,
    181,
    191,
    193,
    197,
    199,
    211,
    223,
    227,
    229,
    233,
    239,
    241,
    251,
    257,
    263,
    269,
    271,
    277,
    281,
    283,
    293,
    307,
    311,
    313,
    317,
    331,
    337,
    347,
    349,
    353,
    359,
    367,
    373,
    379,
    383,
    389,
    397,
    401,
    409,
    419,
    421,
    431,
    433,
    439,
    443,
    449,
    457,
    461,
    463,
    467,
    479,
    487,
    491,
    499,
    503,
    509,
    521,
    523,
    541,
    547,
    557,
    563,
    569,
    571,
    577,
    587,
    593,
    599,
    601,
    607,
    613,
    617,
    619,
    631,
    641,
    643,
    647,
    653,
    659,
    661,
    673,
    677,
    683,
    691,
    701,
    709,
    719,
    727,
    733,
    739,
    743,
    751,
    757,
    761,
    769,
    773,
    787,
    797,
    809,
    811,
    821,
    823,
    827,
    829,
    839,
    853,
    857,
    859,
    863,
    877,
    881,
    883,
    887,
    907,
    911,
    919,
    929,
    937,
    941,
    947,
    953,
    967,
    971,
    977,
    983,
    991,
    997
];
const lplim = (1 << 26) / lowprimes[lowprimes.length - 1];
class BigInteger {
    constructor(a, b, c){
        if (a != null) {
            if ("number" == typeof a) {
                this.fromNumber(a, b, c);
            } else if (b == null && "string" != typeof a) {
                this.fromString(a, 256);
            } else {
                this.fromString(a, b);
            }
        }
        const inBrowser = typeof navigator !== "undefined";
        if (navigator.userAgent.startsWith("Deno")) {
            navigator.appName = "Netscape";
        }
        if (inBrowser && j_lm && navigator.appName == "Microsoft Internet Explorer") {
            this.am = function am2(i, x, w, j, c, n) {
                const xl = x & 0x7fff;
                const xh = x >> 15;
                while(--n >= 0){
                    let l = this[i] & 0x7fff;
                    const h = this[i++] >> 15;
                    const m = xh * l + h * xl;
                    l = xl * l + ((m & 0x7fff) << 15) + w[j] + (c & 0x3fffffff);
                    c = (l >>> 30) + (m >>> 15) + xh * h + (c >>> 30);
                    w[j++] = l & 0x3fffffff;
                }
                return c;
            };
            dbits = 30;
        } else if (inBrowser && j_lm && navigator.appName != "Netscape") {
            this.am = function am1(i, x, w, j, c, n) {
                while(--n >= 0){
                    const v = x * this[i++] + w[j] + c;
                    c = Math.floor(v / 0x4000000);
                    w[j++] = v & 0x3ffffff;
                }
                return c;
            };
            dbits = 26;
        } else {
            this.am = function am3(i, x, w, j, c, n) {
                const xl = x & 0x3fff;
                const xh = x >> 14;
                while(--n >= 0){
                    let l = this[i] & 0x3fff;
                    const h = this[i++] >> 14;
                    const m = xh * l + h * xl;
                    l = xl * l + ((m & 0x3fff) << 14) + w[j] + c;
                    c = (l >> 28) + (m >> 14) + xh * h;
                    w[j++] = l & 0xfffffff;
                }
                return c;
            };
            dbits = 28;
        }
        this.DB = dbits;
        this.DM = (1 << dbits) - 1;
        this.DV = 1 << dbits;
        const BI_FP = 52;
        this.FV = Math.pow(2, BI_FP);
        this.F1 = BI_FP - dbits;
        this.F2 = 2 * dbits - BI_FP;
    }
    toString(b) {
        if (this.s < 0) {
            return "-" + this.negate().toString(b);
        }
        let k;
        if (b == 16) {
            k = 4;
        } else if (b == 8) {
            k = 3;
        } else if (b == 2) {
            k = 1;
        } else if (b == 32) {
            k = 5;
        } else if (b == 4) {
            k = 2;
        } else {
            return this.toRadix(b);
        }
        const km = (1 << k) - 1;
        let d;
        let m = false;
        let r = "";
        let i = this.t;
        let p = this.DB - i * this.DB % k;
        if (i-- > 0) {
            if (p < this.DB && (d = this[i] >> p) > 0) {
                m = true;
                r = int2char(d);
            }
            while(i >= 0){
                if (p < k) {
                    d = (this[i] & (1 << p) - 1) << k - p;
                    d |= this[--i] >> (p += this.DB - k);
                } else {
                    d = this[i] >> (p -= k) & km;
                    if (p <= 0) {
                        p += this.DB;
                        --i;
                    }
                }
                if (d > 0) {
                    m = true;
                }
                if (m) {
                    r += int2char(d);
                }
            }
        }
        return m ? r : "0";
    }
    negate() {
        const r = nbi();
        BigInteger.ZERO.subTo(this, r);
        return r;
    }
    abs() {
        return this.s < 0 ? this.negate() : this;
    }
    compareTo(a) {
        let r = this.s - a.s;
        if (r != 0) {
            return r;
        }
        let i = this.t;
        r = i - a.t;
        if (r != 0) {
            return this.s < 0 ? -r : r;
        }
        while(--i >= 0){
            if ((r = this[i] - a[i]) != 0) {
                return r;
            }
        }
        return 0;
    }
    bitLength() {
        if (this.t <= 0) {
            return 0;
        }
        return this.DB * (this.t - 1) + nbits(this[this.t - 1] ^ this.s & this.DM);
    }
    mod(a) {
        const r = nbi();
        this.abs().divRemTo(a, null, r);
        if (this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) {
            a.subTo(r, r);
        }
        return r;
    }
    modPowInt(e, m) {
        let z;
        if (e < 256 || m.isEven()) {
            z = new Classic(m);
        } else {
            z = new Montgomery(m);
        }
        return this.exp(e, z);
    }
    clone() {
        const r = nbi();
        this.copyTo(r);
        return r;
    }
    intValue() {
        if (this.s < 0) {
            if (this.t == 1) {
                return this[0] - this.DV;
            } else if (this.t == 0) {
                return -1;
            }
        } else if (this.t == 1) {
            return this[0];
        } else if (this.t == 0) {
            return 0;
        }
        return (this[1] & (1 << 32 - this.DB) - 1) << this.DB | this[0];
    }
    byteValue() {
        return this.t == 0 ? this.s : this[0] << 24 >> 24;
    }
    shortValue() {
        return this.t == 0 ? this.s : this[0] << 16 >> 16;
    }
    signum() {
        if (this.s < 0) {
            return -1;
        } else if (this.t <= 0 || this.t == 1 && this[0] <= 0) {
            return 0;
        } else {
            return 1;
        }
    }
    toByteArray() {
        let i = this.t;
        const r = [];
        r[0] = this.s;
        let p = this.DB - i * this.DB % 8;
        let d;
        let k = 0;
        if (i-- > 0) {
            if (p < this.DB && (d = this[i] >> p) != (this.s & this.DM) >> p) {
                r[k++] = d | this.s << this.DB - p;
            }
            while(i >= 0){
                if (p < 8) {
                    d = (this[i] & (1 << p) - 1) << 8 - p;
                    d |= this[--i] >> (p += this.DB - 8);
                } else {
                    d = this[i] >> (p -= 8) & 0xff;
                    if (p <= 0) {
                        p += this.DB;
                        --i;
                    }
                }
                if ((d & 0x80) != 0) {
                    d |= -256;
                }
                if (k == 0 && (this.s & 0x80) != (d & 0x80)) {
                    ++k;
                }
                if (k > 0 || d != this.s) {
                    r[k++] = d;
                }
            }
        }
        return r;
    }
    equals(a) {
        return this.compareTo(a) == 0;
    }
    min(a) {
        return this.compareTo(a) < 0 ? this : a;
    }
    max(a) {
        return this.compareTo(a) > 0 ? this : a;
    }
    and(a) {
        const r = nbi();
        this.bitwiseTo(a, op_and, r);
        return r;
    }
    or(a) {
        const r = nbi();
        this.bitwiseTo(a, op_or, r);
        return r;
    }
    xor(a) {
        const r = nbi();
        this.bitwiseTo(a, op_xor, r);
        return r;
    }
    andNot(a) {
        const r = nbi();
        this.bitwiseTo(a, op_andnot, r);
        return r;
    }
    not() {
        const r = nbi();
        for(let i = 0; i < this.t; ++i){
            r[i] = this.DM & ~this[i];
        }
        r.t = this.t;
        r.s = ~this.s;
        return r;
    }
    shiftLeft(n) {
        const r = nbi();
        if (n < 0) {
            this.rShiftTo(-n, r);
        } else {
            this.lShiftTo(n, r);
        }
        return r;
    }
    shiftRight(n) {
        const r = nbi();
        if (n < 0) {
            this.lShiftTo(-n, r);
        } else {
            this.rShiftTo(n, r);
        }
        return r;
    }
    getLowestSetBit() {
        for(let i = 0; i < this.t; ++i){
            if (this[i] != 0) {
                return i * this.DB + lbit(this[i]);
            }
        }
        if (this.s < 0) {
            return this.t * this.DB;
        }
        return -1;
    }
    bitCount() {
        let r = 0;
        const x = this.s & this.DM;
        for(let i = 0; i < this.t; ++i){
            r += cbit(this[i] ^ x);
        }
        return r;
    }
    testBit(n) {
        const j = Math.floor(n / this.DB);
        if (j >= this.t) {
            return this.s != 0;
        }
        return (this[j] & 1 << n % this.DB) != 0;
    }
    setBit(n) {
        return this.changeBit(n, op_or);
    }
    clearBit(n) {
        return this.changeBit(n, op_andnot);
    }
    flipBit(n) {
        return this.changeBit(n, op_xor);
    }
    add(a) {
        const r = nbi();
        this.addTo(a, r);
        return r;
    }
    subtract(a) {
        const r = nbi();
        this.subTo(a, r);
        return r;
    }
    multiply(a) {
        const r = nbi();
        this.multiplyTo(a, r);
        return r;
    }
    divide(a) {
        const r = nbi();
        this.divRemTo(a, r, null);
        return r;
    }
    remainder(a) {
        const r = nbi();
        this.divRemTo(a, null, r);
        return r;
    }
    divideAndRemainder(a) {
        const q = nbi();
        const r = nbi();
        this.divRemTo(a, q, r);
        return [
            q,
            r
        ];
    }
    modPow(e, m) {
        let i = e.bitLength();
        let k;
        let r = nbv(1);
        let z;
        if (i <= 0) {
            return r;
        } else if (i < 18) {
            k = 1;
        } else if (i < 48) {
            k = 3;
        } else if (i < 144) {
            k = 4;
        } else if (i < 768) {
            k = 5;
        } else {
            k = 6;
        }
        if (i < 8) {
            z = new Classic(m);
        } else if (m.isEven()) {
            z = new Barrett(m);
        } else {
            z = new Montgomery(m);
        }
        const g = [];
        let n = 3;
        const k1 = k - 1;
        const km = (1 << k) - 1;
        g[1] = z.convert(this);
        if (k > 1) {
            const g2 = nbi();
            z.sqrTo(g[1], g2);
            while(n <= km){
                g[n] = nbi();
                z.mulTo(g2, g[n - 2], g[n]);
                n += 2;
            }
        }
        let j = e.t - 1;
        let w;
        let is1 = true;
        let r2 = nbi();
        let t;
        i = nbits(e[j]) - 1;
        while(j >= 0){
            if (i >= k1) {
                w = e[j] >> i - k1 & km;
            } else {
                w = (e[j] & (1 << i + 1) - 1) << k1 - i;
                if (j > 0) {
                    w |= e[j - 1] >> this.DB + i - k1;
                }
            }
            n = k;
            while((w & 1) == 0){
                w >>= 1;
                --n;
            }
            if ((i -= n) < 0) {
                i += this.DB;
                --j;
            }
            if (is1) {
                g[w].copyTo(r);
                is1 = false;
            } else {
                while(n > 1){
                    z.sqrTo(r, r2);
                    z.sqrTo(r2, r);
                    n -= 2;
                }
                if (n > 0) {
                    z.sqrTo(r, r2);
                } else {
                    t = r;
                    r = r2;
                    r2 = t;
                }
                z.mulTo(r2, g[w], r);
            }
            while(j >= 0 && (e[j] & 1 << i) == 0){
                z.sqrTo(r, r2);
                t = r;
                r = r2;
                r2 = t;
                if (--i < 0) {
                    i = this.DB - 1;
                    --j;
                }
            }
        }
        return z.revert(r);
    }
    modInverse(m) {
        const ac = m.isEven();
        if (this.isEven() && ac || m.signum() == 0) {
            return BigInteger.ZERO;
        }
        const u = m.clone();
        const v = this.clone();
        const a = nbv(1);
        const b = nbv(0);
        const c = nbv(0);
        const d = nbv(1);
        while(u.signum() != 0){
            while(u.isEven()){
                u.rShiftTo(1, u);
                if (ac) {
                    if (!a.isEven() || !b.isEven()) {
                        a.addTo(this, a);
                        b.subTo(m, b);
                    }
                    a.rShiftTo(1, a);
                } else if (!b.isEven()) {
                    b.subTo(m, b);
                }
                b.rShiftTo(1, b);
            }
            while(v.isEven()){
                v.rShiftTo(1, v);
                if (ac) {
                    if (!c.isEven() || !d.isEven()) {
                        c.addTo(this, c);
                        d.subTo(m, d);
                    }
                    c.rShiftTo(1, c);
                } else if (!d.isEven()) {
                    d.subTo(m, d);
                }
                d.rShiftTo(1, d);
            }
            if (u.compareTo(v) >= 0) {
                u.subTo(v, u);
                if (ac) {
                    a.subTo(c, a);
                }
                b.subTo(d, b);
            } else {
                v.subTo(u, v);
                if (ac) {
                    c.subTo(a, c);
                }
                d.subTo(b, d);
            }
        }
        if (v.compareTo(BigInteger.ONE) != 0) {
            return BigInteger.ZERO;
        }
        if (d.compareTo(m) >= 0) {
            return d.subtract(m);
        }
        if (d.signum() < 0) {
            d.addTo(m, d);
        } else {
            return d;
        }
        if (d.signum() < 0) {
            return d.add(m);
        } else {
            return d;
        }
    }
    pow(e) {
        return this.exp(e, new NullExp());
    }
    gcd(a) {
        let x = this.s < 0 ? this.negate() : this.clone();
        let y = a.s < 0 ? a.negate() : a.clone();
        if (x.compareTo(y) < 0) {
            const t = x;
            x = y;
            y = t;
        }
        let i = x.getLowestSetBit();
        let g = y.getLowestSetBit();
        if (g < 0) {
            return x;
        }
        if (i < g) {
            g = i;
        }
        if (g > 0) {
            x.rShiftTo(g, x);
            y.rShiftTo(g, y);
        }
        while(x.signum() > 0){
            if ((i = x.getLowestSetBit()) > 0) {
                x.rShiftTo(i, x);
            }
            if ((i = y.getLowestSetBit()) > 0) {
                y.rShiftTo(i, y);
            }
            if (x.compareTo(y) >= 0) {
                x.subTo(y, x);
                x.rShiftTo(1, x);
            } else {
                y.subTo(x, y);
                y.rShiftTo(1, y);
            }
        }
        if (g > 0) {
            y.lShiftTo(g, y);
        }
        return y;
    }
    isProbablePrime(t) {
        let i;
        const x = this.abs();
        if (x.t == 1 && x[0] <= lowprimes[lowprimes.length - 1]) {
            for(i = 0; i < lowprimes.length; ++i){
                if (x[0] == lowprimes[i]) {
                    return true;
                }
            }
            return false;
        }
        if (x.isEven()) {
            return false;
        }
        i = 1;
        while(i < lowprimes.length){
            let m = lowprimes[i];
            let j = i + 1;
            while(j < lowprimes.length && m < lplim){
                m *= lowprimes[j++];
            }
            m = x.modInt(m);
            while(i < j){
                if (m % lowprimes[i++] == 0) {
                    return false;
                }
            }
        }
        return x.millerRabin(t);
    }
    copyTo(r) {
        for(let i = this.t - 1; i >= 0; --i){
            r[i] = this[i];
        }
        r.t = this.t;
        r.s = this.s;
    }
    fromInt(x) {
        this.t = 1;
        this.s = x < 0 ? -1 : 0;
        if (x > 0) {
            this[0] = x;
        } else if (x < -1) {
            this[0] = x + this.DV;
        } else {
            this.t = 0;
        }
    }
    fromString(s, b) {
        let k;
        if (b == 16) {
            k = 4;
        } else if (b == 8) {
            k = 3;
        } else if (b == 256) {
            k = 8;
        } else if (b == 2) {
            k = 1;
        } else if (b == 32) {
            k = 5;
        } else if (b == 4) {
            k = 2;
        } else {
            this.fromRadix(s, b);
            return;
        }
        this.t = 0;
        this.s = 0;
        let i = s.length;
        let mi = false;
        let sh = 0;
        while(--i >= 0){
            const x = k == 8 ? +s[i] & 0xff : intAt(s, i);
            if (x < 0) {
                if (s.charAt(i) == "-") {
                    mi = true;
                }
                continue;
            }
            mi = false;
            if (sh == 0) {
                this[this.t++] = x;
            } else if (sh + k > this.DB) {
                this[this.t - 1] |= (x & (1 << this.DB - sh) - 1) << sh;
                this[this.t++] = x >> this.DB - sh;
            } else {
                this[this.t - 1] |= x << sh;
            }
            sh += k;
            if (sh >= this.DB) {
                sh -= this.DB;
            }
        }
        if (k == 8 && (+s[0] & 0x80) != 0) {
            this.s = -1;
            if (sh > 0) {
                this[this.t - 1] |= (1 << this.DB - sh) - 1 << sh;
            }
        }
        this.clamp();
        if (mi) {
            BigInteger.ZERO.subTo(this, this);
        }
    }
    clamp() {
        const c = this.s & this.DM;
        while(this.t > 0 && this[this.t - 1] == c){
            --this.t;
        }
    }
    dlShiftTo(n, r) {
        let i;
        for(i = this.t - 1; i >= 0; --i){
            r[i + n] = this[i];
        }
        for(i = n - 1; i >= 0; --i){
            r[i] = 0;
        }
        r.t = this.t + n;
        r.s = this.s;
    }
    drShiftTo(n, r) {
        for(let i = n; i < this.t; ++i){
            r[i - n] = this[i];
        }
        r.t = Math.max(this.t - n, 0);
        r.s = this.s;
    }
    lShiftTo(n, r) {
        const bs = n % this.DB;
        const cbs = this.DB - bs;
        const bm = (1 << cbs) - 1;
        const ds = Math.floor(n / this.DB);
        let c = this.s << bs & this.DM;
        for(let i = this.t - 1; i >= 0; --i){
            r[i + ds + 1] = this[i] >> cbs | c;
            c = (this[i] & bm) << bs;
        }
        for(let i = ds - 1; i >= 0; --i){
            r[i] = 0;
        }
        r[ds] = c;
        r.t = this.t + ds + 1;
        r.s = this.s;
        r.clamp();
    }
    rShiftTo(n, r) {
        r.s = this.s;
        const ds = Math.floor(n / this.DB);
        if (ds >= this.t) {
            r.t = 0;
            return;
        }
        const bs = n % this.DB;
        const cbs = this.DB - bs;
        const bm = (1 << bs) - 1;
        r[0] = this[ds] >> bs;
        for(let i = ds + 1; i < this.t; ++i){
            r[i - ds - 1] |= (this[i] & bm) << cbs;
            r[i - ds] = this[i] >> bs;
        }
        if (bs > 0) {
            r[this.t - ds - 1] |= (this.s & bm) << cbs;
        }
        r.t = this.t - ds;
        r.clamp();
    }
    subTo(a, r) {
        let i = 0;
        let c = 0;
        const m = Math.min(a.t, this.t);
        while(i < m){
            c += this[i] - a[i];
            r[i++] = c & this.DM;
            c >>= this.DB;
        }
        if (a.t < this.t) {
            c -= a.s;
            while(i < this.t){
                c += this[i];
                r[i++] = c & this.DM;
                c >>= this.DB;
            }
            c += this.s;
        } else {
            c += this.s;
            while(i < a.t){
                c -= a[i];
                r[i++] = c & this.DM;
                c >>= this.DB;
            }
            c -= a.s;
        }
        r.s = c < 0 ? -1 : 0;
        if (c < -1) {
            r[i++] = this.DV + c;
        } else if (c > 0) {
            r[i++] = c;
        }
        r.t = i;
        r.clamp();
    }
    multiplyTo(a, r) {
        const x = this.abs();
        const y = a.abs();
        let i = x.t;
        r.t = i + y.t;
        while(--i >= 0){
            r[i] = 0;
        }
        for(i = 0; i < y.t; ++i){
            r[i + x.t] = x.am(0, y[i], r, i, 0, x.t);
        }
        r.s = 0;
        r.clamp();
        if (this.s != a.s) {
            BigInteger.ZERO.subTo(r, r);
        }
    }
    squareTo(r) {
        const x = this.abs();
        let i = r.t = 2 * x.t;
        while(--i >= 0){
            r[i] = 0;
        }
        for(i = 0; i < x.t - 1; ++i){
            const c = x.am(i, x[i], r, 2 * i, 0, 1);
            if ((r[i + x.t] += x.am(i + 1, 2 * x[i], r, 2 * i + 1, c, x.t - i - 1)) >= x.DV) {
                r[i + x.t] -= x.DV;
                r[i + x.t + 1] = 1;
            }
        }
        if (r.t > 0) {
            r[r.t - 1] += x.am(i, x[i], r, 2 * i, 0, 1);
        }
        r.s = 0;
        r.clamp();
    }
    divRemTo(m, q, r) {
        const pm = m.abs();
        if (pm.t <= 0) {
            return;
        }
        const pt = this.abs();
        if (pt.t < pm.t) {
            if (q != null) {
                q.fromInt(0);
            }
            if (r != null) {
                this.copyTo(r);
            }
            return;
        }
        if (r == null) {
            r = nbi();
        }
        const y = nbi();
        const ts = this.s;
        const ms = m.s;
        const nsh = this.DB - nbits(pm[pm.t - 1]);
        if (nsh > 0) {
            pm.lShiftTo(nsh, y);
            pt.lShiftTo(nsh, r);
        } else {
            pm.copyTo(y);
            pt.copyTo(r);
        }
        const ys = y.t;
        const y0 = y[ys - 1];
        if (y0 == 0) {
            return;
        }
        const yt = y0 * (1 << this.F1) + (ys > 1 ? y[ys - 2] >> this.F2 : 0);
        const d1 = this.FV / yt;
        const d2 = (1 << this.F1) / yt;
        const e = 1 << this.F2;
        let i = r.t;
        let j = i - ys;
        const t = q == null ? nbi() : q;
        y.dlShiftTo(j, t);
        if (r.compareTo(t) >= 0) {
            r[r.t++] = 1;
            r.subTo(t, r);
        }
        BigInteger.ONE.dlShiftTo(ys, t);
        t.subTo(y, y);
        while(y.t < ys){
            y[y.t++] = 0;
        }
        while(--j >= 0){
            let qd = r[--i] == y0 ? this.DM : Math.floor(r[i] * d1 + (r[i - 1] + e) * d2);
            if ((r[i] += y.am(0, qd, r, j, 0, ys)) < qd) {
                y.dlShiftTo(j, t);
                r.subTo(t, r);
                while(r[i] < --qd){
                    r.subTo(t, r);
                }
            }
        }
        if (q != null) {
            r.drShiftTo(ys, q);
            if (ts != ms) {
                BigInteger.ZERO.subTo(q, q);
            }
        }
        r.t = ys;
        r.clamp();
        if (nsh > 0) {
            r.rShiftTo(nsh, r);
        }
        if (ts < 0) {
            BigInteger.ZERO.subTo(r, r);
        }
    }
    invDigit() {
        if (this.t < 1) {
            return 0;
        }
        const x = this[0];
        if ((x & 1) == 0) {
            return 0;
        }
        let y = x & 3;
        y = y * (2 - (x & 0xf) * y) & 0xf;
        y = y * (2 - (x & 0xff) * y) & 0xff;
        y = y * (2 - ((x & 0xffff) * y & 0xffff)) & 0xffff;
        y = y * (2 - x * y % this.DV) % this.DV;
        return y > 0 ? this.DV - y : -y;
    }
    isEven() {
        return (this.t > 0 ? this[0] & 1 : this.s) == 0;
    }
    exp(e, z) {
        if (e > 0xffffffff || e < 1) {
            return BigInteger.ONE;
        }
        let r = nbi();
        let r2 = nbi();
        const g = z.convert(this);
        let i = nbits(e) - 1;
        g.copyTo(r);
        while(--i >= 0){
            z.sqrTo(r, r2);
            if ((e & 1 << i) > 0) {
                z.mulTo(r2, g, r);
            } else {
                const t = r;
                r = r2;
                r2 = t;
            }
        }
        return z.revert(r);
    }
    chunkSize(r) {
        return Math.floor(Math.LN2 * this.DB / Math.log(r));
    }
    toRadix(b) {
        if (b == null) {
            b = 10;
        }
        if (this.signum() == 0 || b < 2 || b > 36) {
            return "0";
        }
        const cs = this.chunkSize(b);
        const a = Math.pow(b, cs);
        const d = nbv(a);
        const y = nbi();
        const z = nbi();
        let r = "";
        this.divRemTo(d, y, z);
        while(y.signum() > 0){
            r = (a + z.intValue()).toString(b).substr(1) + r;
            y.divRemTo(d, y, z);
        }
        return z.intValue().toString(b) + r;
    }
    fromRadix(s, b) {
        this.fromInt(0);
        if (b == null) {
            b = 10;
        }
        const cs = this.chunkSize(b);
        const d = Math.pow(b, cs);
        let mi = false;
        let j = 0;
        let w = 0;
        for(let i = 0; i < s.length; ++i){
            const x = intAt(s, i);
            if (x < 0) {
                if (s.charAt(i) == "-" && this.signum() == 0) {
                    mi = true;
                }
                continue;
            }
            w = b * w + x;
            if (++j >= cs) {
                this.dMultiply(d);
                this.dAddOffset(w, 0);
                j = 0;
                w = 0;
            }
        }
        if (j > 0) {
            this.dMultiply(Math.pow(b, j));
            this.dAddOffset(w, 0);
        }
        if (mi) {
            BigInteger.ZERO.subTo(this, this);
        }
    }
    fromNumber(a, b, c) {
        if ("number" == typeof b) {
            if (a < 2) {
                this.fromInt(1);
            } else {
                this.fromNumber(a, c);
                if (!this.testBit(a - 1)) {
                    this.bitwiseTo(BigInteger.ONE.shiftLeft(a - 1), op_or, this);
                }
                if (this.isEven()) {
                    this.dAddOffset(1, 0);
                }
                while(!this.isProbablePrime(b)){
                    this.dAddOffset(2, 0);
                    if (this.bitLength() > a) {
                        this.subTo(BigInteger.ONE.shiftLeft(a - 1), this);
                    }
                }
            }
        } else {
            const x = [];
            const t = a & 7;
            x.length = (a >> 3) + 1;
            b.nextBytes(x);
            if (t > 0) {
                x[0] &= (1 << t) - 1;
            } else {
                x[0] = 0;
            }
            this.fromString(x, 256);
        }
    }
    bitwiseTo(a, op, r) {
        let i;
        let f;
        const m = Math.min(a.t, this.t);
        for(i = 0; i < m; ++i){
            r[i] = op(this[i], a[i]);
        }
        if (a.t < this.t) {
            f = a.s & this.DM;
            for(i = m; i < this.t; ++i){
                r[i] = op(this[i], f);
            }
            r.t = this.t;
        } else {
            f = this.s & this.DM;
            for(i = m; i < a.t; ++i){
                r[i] = op(f, a[i]);
            }
            r.t = a.t;
        }
        r.s = op(this.s, a.s);
        r.clamp();
    }
    changeBit(n, op) {
        const r = BigInteger.ONE.shiftLeft(n);
        this.bitwiseTo(r, op, r);
        return r;
    }
    addTo(a, r) {
        let i = 0;
        let c = 0;
        const m = Math.min(a.t, this.t);
        while(i < m){
            c += this[i] + a[i];
            r[i++] = c & this.DM;
            c >>= this.DB;
        }
        if (a.t < this.t) {
            c += a.s;
            while(i < this.t){
                c += this[i];
                r[i++] = c & this.DM;
                c >>= this.DB;
            }
            c += this.s;
        } else {
            c += this.s;
            while(i < a.t){
                c += a[i];
                r[i++] = c & this.DM;
                c >>= this.DB;
            }
            c += a.s;
        }
        r.s = c < 0 ? -1 : 0;
        if (c > 0) {
            r[i++] = c;
        } else if (c < -1) {
            r[i++] = this.DV + c;
        }
        r.t = i;
        r.clamp();
    }
    dMultiply(n) {
        this[this.t] = this.am(0, n - 1, this, 0, 0, this.t);
        ++this.t;
        this.clamp();
    }
    dAddOffset(n, w) {
        if (n == 0) {
            return;
        }
        while(this.t <= w){
            this[this.t++] = 0;
        }
        this[w] += n;
        while(this[w] >= this.DV){
            this[w] -= this.DV;
            if (++w >= this.t) {
                this[this.t++] = 0;
            }
            ++this[w];
        }
    }
    multiplyLowerTo(a, n, r) {
        let i = Math.min(this.t + a.t, n);
        r.s = 0;
        r.t = i;
        while(i > 0){
            r[--i] = 0;
        }
        for(const j = r.t - this.t; i < j; ++i){
            r[i + this.t] = this.am(0, a[i], r, i, 0, this.t);
        }
        for(const j = Math.min(a.t, n); i < j; ++i){
            this.am(0, a[i], r, i, 0, n - i);
        }
        r.clamp();
    }
    multiplyUpperTo(a, n, r) {
        --n;
        let i = r.t = this.t + a.t - n;
        r.s = 0;
        while(--i >= 0){
            r[i] = 0;
        }
        for(i = Math.max(n - this.t, 0); i < a.t; ++i){
            r[this.t + i - n] = this.am(n - i, a[i], r, 0, 0, this.t + i - n);
        }
        r.clamp();
        r.drShiftTo(1, r);
    }
    modInt(n) {
        if (n <= 0) {
            return 0;
        }
        const d = this.DV % n;
        let r = this.s < 0 ? n - 1 : 0;
        if (this.t > 0) {
            if (d == 0) {
                r = this[0] % n;
            } else {
                for(let i = this.t - 1; i >= 0; --i){
                    r = (d * r + this[i]) % n;
                }
            }
        }
        return r;
    }
    millerRabin(t) {
        const n1 = this.subtract(BigInteger.ONE);
        const k = n1.getLowestSetBit();
        if (k <= 0) {
            return false;
        }
        const r = n1.shiftRight(k);
        t = t + 1 >> 1;
        if (t > lowprimes.length) {
            t = lowprimes.length;
        }
        const a = nbi();
        for(let i = 0; i < t; ++i){
            a.fromInt(lowprimes[Math.floor(Math.random() * lowprimes.length)]);
            let y = a.modPow(r, this);
            if (y.compareTo(BigInteger.ONE) != 0 && y.compareTo(n1) != 0) {
                let j = 1;
                while(j++ < k && y.compareTo(n1) != 0){
                    y = y.modPowInt(2, this);
                    if (y.compareTo(BigInteger.ONE) == 0) {
                        return false;
                    }
                }
                if (y.compareTo(n1) != 0) {
                    return false;
                }
            }
        }
        return true;
    }
    square() {
        const r = nbi();
        this.squareTo(r);
        return r;
    }
    gcda(a, callback) {
        let x = this.s < 0 ? this.negate() : this.clone();
        let y = a.s < 0 ? a.negate() : a.clone();
        if (x.compareTo(y) < 0) {
            const t = x;
            x = y;
            y = t;
        }
        let i = x.getLowestSetBit();
        let g = y.getLowestSetBit();
        if (g < 0) {
            callback(x);
            return;
        }
        if (i < g) {
            g = i;
        }
        if (g > 0) {
            x.rShiftTo(g, x);
            y.rShiftTo(g, y);
        }
        const gcda1 = function() {
            if ((i = x.getLowestSetBit()) > 0) {
                x.rShiftTo(i, x);
            }
            if ((i = y.getLowestSetBit()) > 0) {
                y.rShiftTo(i, y);
            }
            if (x.compareTo(y) >= 0) {
                x.subTo(y, x);
                x.rShiftTo(1, x);
            } else {
                y.subTo(x, y);
                y.rShiftTo(1, y);
            }
            if (!(x.signum() > 0)) {
                if (g > 0) {
                    y.lShiftTo(g, y);
                }
                setTimeout(function() {
                    callback(y);
                }, 0);
            } else {
                setTimeout(gcda1, 0);
            }
        };
        setTimeout(gcda1, 10);
    }
    fromNumberAsync(a, b, c, callback) {
        if ("number" == typeof b) {
            if (a < 2) {
                this.fromInt(1);
            } else {
                this.fromNumber(a, c);
                if (!this.testBit(a - 1)) {
                    this.bitwiseTo(BigInteger.ONE.shiftLeft(a - 1), op_or, this);
                }
                if (this.isEven()) {
                    this.dAddOffset(1, 0);
                }
                const bnp = this;
                const bnpfn1 = function() {
                    bnp.dAddOffset(2, 0);
                    if (bnp.bitLength() > a) {
                        bnp.subTo(BigInteger.ONE.shiftLeft(a - 1), bnp);
                    }
                    if (bnp.isProbablePrime(b)) {
                        setTimeout(function() {
                            callback();
                        }, 0);
                    } else {
                        setTimeout(bnpfn1, 0);
                    }
                };
                setTimeout(bnpfn1, 0);
            }
        } else {
            const x = [];
            const t = a & 7;
            x.length = (a >> 3) + 1;
            b.nextBytes(x);
            if (t > 0) {
                x[0] &= (1 << t) - 1;
            } else {
                x[0] = 0;
            }
            this.fromString(x, 256);
        }
    }
    s;
    t;
    DB;
    DM;
    DV;
    FV;
    F1;
    F2;
    am;
    static ONE;
    static ZERO;
}
class NullExp {
    constructor(){}
    convert(x) {
        return x;
    }
    revert(x) {
        return x;
    }
    mulTo(x, y, r) {
        x.multiplyTo(y, r);
    }
    sqrTo(x, r) {
        x.squareTo(r);
    }
}
class Classic {
    m;
    constructor(m){
        this.m = m;
    }
    convert(x) {
        if (x.s < 0 || x.compareTo(this.m) >= 0) {
            return x.mod(this.m);
        } else {
            return x;
        }
    }
    revert(x) {
        return x;
    }
    reduce(x) {
        x.divRemTo(this.m, null, x);
    }
    mulTo(x, y, r) {
        x.multiplyTo(y, r);
        this.reduce(r);
    }
    sqrTo(x, r) {
        x.squareTo(r);
        this.reduce(r);
    }
}
class Montgomery {
    m;
    constructor(m){
        this.m = m;
        this.mp = m.invDigit();
        this.mpl = this.mp & 0x7fff;
        this.mph = this.mp >> 15;
        this.um = (1 << m.DB - 15) - 1;
        this.mt2 = 2 * m.t;
    }
    mp;
    mpl;
    mph;
    um;
    mt2;
    convert(x) {
        const r = nbi();
        x.abs().dlShiftTo(this.m.t, r);
        r.divRemTo(this.m, null, r);
        if (x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) {
            this.m.subTo(r, r);
        }
        return r;
    }
    revert(x) {
        const r = nbi();
        x.copyTo(r);
        this.reduce(r);
        return r;
    }
    reduce(x) {
        while(x.t <= this.mt2){
            x[x.t++] = 0;
        }
        for(let i = 0; i < this.m.t; ++i){
            let j = x[i] & 0x7fff;
            const u0 = j * this.mpl + ((j * this.mph + (x[i] >> 15) * this.mpl & this.um) << 15) & x.DM;
            j = i + this.m.t;
            x[j] += this.m.am(0, u0, x, i, 0, this.m.t);
            while(x[j] >= x.DV){
                x[j] -= x.DV;
                x[++j]++;
            }
        }
        x.clamp();
        x.drShiftTo(this.m.t, x);
        if (x.compareTo(this.m) >= 0) {
            x.subTo(this.m, x);
        }
    }
    mulTo(x, y, r) {
        x.multiplyTo(y, r);
        this.reduce(r);
    }
    sqrTo(x, r) {
        x.squareTo(r);
        this.reduce(r);
    }
}
class Barrett {
    m;
    constructor(m){
        this.m = m;
        this.r2 = nbi();
        this.q3 = nbi();
        BigInteger.ONE.dlShiftTo(2 * m.t, this.r2);
        this.mu = this.r2.divide(m);
    }
    r2;
    q3;
    mu;
    convert(x) {
        if (x.s < 0 || x.t > 2 * this.m.t) {
            return x.mod(this.m);
        } else if (x.compareTo(this.m) < 0) {
            return x;
        } else {
            const r = nbi();
            x.copyTo(r);
            this.reduce(r);
            return r;
        }
    }
    revert(x) {
        return x;
    }
    reduce(x) {
        x.drShiftTo(this.m.t - 1, this.r2);
        if (x.t > this.m.t + 1) {
            x.t = this.m.t + 1;
            x.clamp();
        }
        this.mu.multiplyUpperTo(this.r2, this.m.t + 1, this.q3);
        this.m.multiplyLowerTo(this.q3, this.m.t + 1, this.r2);
        while(x.compareTo(this.r2) < 0){
            x.dAddOffset(1, this.m.t + 1);
        }
        x.subTo(this.r2, x);
        while(x.compareTo(this.m) >= 0){
            x.subTo(this.m, x);
        }
    }
    mulTo(x, y, r) {
        x.multiplyTo(y, r);
        this.reduce(r);
    }
    sqrTo(x, r) {
        x.squareTo(r);
        this.reduce(r);
    }
}
function nbi() {
    return new BigInteger(null);
}
function parseBigInt(str, r) {
    return new BigInteger(str, r);
}
const BI_RC = [];
let rr;
let vv;
rr = "0".charCodeAt(0);
for(vv = 0; vv <= 9; ++vv){
    BI_RC[rr++] = vv;
}
rr = "a".charCodeAt(0);
for(vv = 10; vv < 36; ++vv){
    BI_RC[rr++] = vv;
}
rr = "A".charCodeAt(0);
for(vv = 10; vv < 36; ++vv){
    BI_RC[rr++] = vv;
}
function intAt(s, i) {
    const c = BI_RC[s.charCodeAt(i)];
    return c == null ? -1 : c;
}
function nbv(i) {
    const r = nbi();
    r.fromInt(i);
    return r;
}
function nbits(x) {
    let r = 1;
    let t;
    if ((t = x >>> 16) != 0) {
        x = t;
        r += 16;
    }
    if ((t = x >> 8) != 0) {
        x = t;
        r += 8;
    }
    if ((t = x >> 4) != 0) {
        x = t;
        r += 4;
    }
    if ((t = x >> 2) != 0) {
        x = t;
        r += 2;
    }
    if ((t = x >> 1) != 0) {
        x = t;
        r += 1;
    }
    return r;
}
BigInteger.ZERO = nbv(0);
BigInteger.ONE = nbv(1);
const __default1 = {
    parseBigInt,
    nbi,
    nbv,
    nbits,
    intAt,
    BigInteger,
    Barrett,
    Classic,
    Montgomery,
    NullExp,
    lowprimes,
    lplim,
    op_and,
    op_or,
    op_xor,
    op_andnot
};
class Arcfour {
    constructor(){
        this.i = 0;
        this.j = 0;
        this.S = [];
    }
    init(key) {
        let i;
        let j;
        let t;
        for(i = 0; i < 256; ++i){
            this.S[i] = i;
        }
        j = 0;
        for(i = 0; i < 256; ++i){
            j = j + this.S[i] + key[i % key.length] & 255;
            t = this.S[i];
            this.S[i] = this.S[j];
            this.S[j] = t;
        }
        this.i = 0;
        this.j = 0;
    }
    next() {
        let t;
        this.i = this.i + 1 & 255;
        this.j = this.j + this.S[this.i] & 255;
        t = this.S[this.i];
        this.S[this.i] = this.S[this.j];
        this.S[this.j] = t;
        return this.S[t + this.S[this.i] & 255];
    }
    i;
    j;
    S;
}
function prng_newstate() {
    return new Arcfour();
}
let rng_psize = 256;
let rng_state;
let rng_pool = null;
let rng_pptr;
if (rng_pool == null) {
    rng_pool = [];
    rng_pptr = 0;
    let t;
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        const z = new Uint32Array(256);
        window.crypto.getRandomValues(z);
        for(t = 0; t < z.length; ++t){
            rng_pool[rng_pptr++] = z[t] & 255;
        }
    }
    var count = 0;
    const onMouseMoveListener = function(ev) {
        count = count || 0;
        if (count >= 256 || rng_pptr >= rng_psize) {
            if (window.removeEventListener) {
                window.removeEventListener("mousemove", onMouseMoveListener, false);
            } else if (window.detachEvent) {
                window.detachEvent("onmousemove", onMouseMoveListener);
            }
            return;
        }
        try {
            const mouseCoordinates = ev.x + ev.y;
            rng_pool[rng_pptr++] = mouseCoordinates & 255;
            count += 1;
        } catch (e) {}
    };
    if (typeof window !== 'undefined') {
        if (window.addEventListener) {
            window.addEventListener("mousemove", onMouseMoveListener, false);
        } else if (window.attachEvent) {
            window.attachEvent("onmousemove", onMouseMoveListener);
        }
    }
}
function rng_get_byte() {
    if (rng_state == null) {
        rng_state = prng_newstate();
        while(rng_pptr < rng_psize){
            const random = Math.floor(65536 * Math.random());
            rng_pool[rng_pptr++] = random & 255;
        }
        rng_state.init(rng_pool);
        for(rng_pptr = 0; rng_pptr < rng_pool.length; ++rng_pptr){
            rng_pool[rng_pptr] = 0;
        }
        rng_pptr = 0;
    }
    return rng_state.next();
}
class SecureRandom {
    nextBytes(ba) {
        for(let i = 0; i < ba.length; ++i){
            ba[i] = rng_get_byte();
        }
    }
}
function pkcs1pad1(s, n) {
    if (n < s.length + 22) {
        console.error("Message too long for RSA pkcs1pad1");
        return null;
    }
    const len = n - s.length - 6;
    let filler = "";
    for(let f = 0; f < len; f += 2){
        filler += "ff";
    }
    const m = "0001" + filler + "00" + s;
    return parseBigInt(m, 16);
}
function pkcs1pad2(s, n) {
    if (n < s.length + 11) {
        console.error("Message too long for RSA pkcs1pad2");
        return null;
    }
    const ba = [];
    let i = s.length - 1;
    while(i >= 0 && n > 0){
        const c = s.charCodeAt(i--);
        if (c < 128) {
            ba[--n] = c;
        } else if (c > 127 && c < 2048) {
            ba[--n] = c & 63 | 128;
            ba[--n] = c >> 6 | 192;
        } else {
            ba[--n] = c & 63 | 128;
            ba[--n] = c >> 6 & 63 | 128;
            ba[--n] = c >> 12 | 224;
        }
    }
    ba[--n] = 0;
    const rng = new SecureRandom();
    const x = [];
    while(n > 2){
        x[0] = 0;
        while(x[0] == 0){
            rng.nextBytes(x);
        }
        ba[--n] = x[0];
    }
    ba[--n] = 2;
    ba[--n] = 0;
    return new BigInteger(ba);
}
class RSAKey {
    constructor(){
        this.n = null;
        this.e = 0;
        this.d = null;
        this.p = null;
        this.q = null;
        this.dmp1 = null;
        this.dmq1 = null;
        this.coeff = null;
    }
    doPublic(x) {
        return x.modPowInt(this.e, this.n);
    }
    doPrivate(x) {
        if (this.p == null || this.q == null) {
            return x.modPow(this.d, this.n);
        }
        let xp = x.mod(this.p).modPow(this.dmp1, this.p);
        const xq = x.mod(this.q).modPow(this.dmq1, this.q);
        while(xp.compareTo(xq) < 0){
            xp = xp.add(this.p);
        }
        return xp.subtract(xq).multiply(this.coeff).mod(this.p).multiply(this.q).add(xq);
    }
    setPublic(N, E) {
        if (N != null && E != null && N.length > 0 && E.length > 0) {
            this.n = parseBigInt(N, 16);
            this.e = parseInt(E, 16);
        } else {
            console.error("Invalid RSA public key");
        }
    }
    encrypt(text) {
        const maxLength = this.n.bitLength() + 7 >> 3;
        const m = pkcs1pad2(text, maxLength);
        if (m == null) {
            return null;
        }
        const c = this.doPublic(m);
        if (c == null) {
            return null;
        }
        let h = c.toString(16);
        let length = h.length;
        for(let i = 0; i < maxLength * 2 - length; i++){
            h = "0" + h;
        }
        return h;
    }
    setPrivate(N, E, D) {
        if (N != null && E != null && N.length > 0 && E.length > 0) {
            this.n = parseBigInt(N, 16);
            this.e = parseInt(E, 16);
            this.d = parseBigInt(D, 16);
        } else {
            console.error("Invalid RSA private key");
        }
    }
    setPrivateEx(N, E, D, P, Q, DP, DQ, C) {
        if (N != null && E != null && N.length > 0 && E.length > 0) {
            this.n = parseBigInt(N, 16);
            this.e = parseInt(E, 16);
            this.d = parseBigInt(D, 16);
            this.p = parseBigInt(P, 16);
            this.q = parseBigInt(Q, 16);
            this.dmp1 = parseBigInt(DP, 16);
            this.dmq1 = parseBigInt(DQ, 16);
            this.coeff = parseBigInt(C, 16);
        } else {
            console.error("Invalid RSA private key");
        }
    }
    generate(B, E) {
        const rng = new SecureRandom();
        const qs = B >> 1;
        this.e = parseInt(E, 16);
        const ee = new BigInteger(E, 16);
        for(;;){
            for(;;){
                this.p = new BigInteger(B - qs, 1, rng);
                if (this.p.subtract(BigInteger.ONE).gcd(ee).compareTo(BigInteger.ONE) == 0 && this.p.isProbablePrime(10)) {
                    break;
                }
            }
            for(;;){
                this.q = new BigInteger(qs, 1, rng);
                if (this.q.subtract(BigInteger.ONE).gcd(ee).compareTo(BigInteger.ONE) == 0 && this.q.isProbablePrime(10)) {
                    break;
                }
            }
            if (this.p.compareTo(this.q) <= 0) {
                const t = this.p;
                this.p = this.q;
                this.q = t;
            }
            const p1 = this.p.subtract(BigInteger.ONE);
            const q1 = this.q.subtract(BigInteger.ONE);
            const phi = p1.multiply(q1);
            if (phi.gcd(ee).compareTo(BigInteger.ONE) == 0) {
                this.n = this.p.multiply(this.q);
                this.d = ee.modInverse(phi);
                this.dmp1 = this.d.mod(p1);
                this.dmq1 = this.d.mod(q1);
                this.coeff = this.q.modInverse(this.p);
                break;
            }
        }
    }
    decrypt(ctext) {
        const c = parseBigInt(ctext, 16);
        const m = this.doPrivate(c);
        if (m == null) {
            return null;
        }
        return pkcs1unpad2(m, this.n.bitLength() + 7 >> 3);
    }
    generateAsync(B, E, callback) {
        const rng = new SecureRandom();
        const qs = B >> 1;
        this.e = parseInt(E, 16);
        const ee = new BigInteger(E, 16);
        const rsa = this;
        const loop1 = function() {
            const loop4 = function() {
                if (rsa.p.compareTo(rsa.q) <= 0) {
                    const t = rsa.p;
                    rsa.p = rsa.q;
                    rsa.q = t;
                }
                const p1 = rsa.p.subtract(BigInteger.ONE);
                const q1 = rsa.q.subtract(BigInteger.ONE);
                const phi = p1.multiply(q1);
                if (phi.gcd(ee).compareTo(BigInteger.ONE) == 0) {
                    rsa.n = rsa.p.multiply(rsa.q);
                    rsa.d = ee.modInverse(phi);
                    rsa.dmp1 = rsa.d.mod(p1);
                    rsa.dmq1 = rsa.d.mod(q1);
                    rsa.coeff = rsa.q.modInverse(rsa.p);
                    setTimeout(function() {
                        callback();
                    }, 0);
                } else {
                    setTimeout(loop1, 0);
                }
            };
            const loop3 = function() {
                rsa.q = nbi();
                rsa.q.fromNumberAsync(qs, 1, rng, function() {
                    rsa.q.subtract(BigInteger.ONE).gcda(ee, function(r) {
                        if (r.compareTo(BigInteger.ONE) == 0 && rsa.q.isProbablePrime(10)) {
                            setTimeout(loop4, 0);
                        } else {
                            setTimeout(loop3, 0);
                        }
                    });
                });
            };
            const loop2 = function() {
                rsa.p = nbi();
                rsa.p.fromNumberAsync(B - qs, 1, rng, function() {
                    rsa.p.subtract(BigInteger.ONE).gcda(ee, function(r) {
                        if (r.compareTo(BigInteger.ONE) == 0 && rsa.p.isProbablePrime(10)) {
                            setTimeout(loop3, 0);
                        } else {
                            setTimeout(loop2, 0);
                        }
                    });
                });
            };
            setTimeout(loop2, 0);
        };
        setTimeout(loop1, 0);
    }
    sign(text, digestMethod, digestName) {
        const header = getDigestHeader(digestName);
        const digest = header + digestMethod(text).toString();
        const m = pkcs1pad1(digest, this.n.bitLength() / 4);
        if (m == null) {
            return null;
        }
        const c = this.doPrivate(m);
        if (c == null) {
            return null;
        }
        const h = c.toString(16);
        if ((h.length & 1) == 0) {
            return h;
        } else {
            return "0" + h;
        }
    }
    verify(text, signature, digestMethod) {
        const c = parseBigInt(signature, 16);
        const m = this.doPublic(c);
        if (m == null) {
            return null;
        }
        const unpadded = m.toString(16).replace(/^1f+00/, "");
        const digest = removeDigestHeader(unpadded);
        return digest == digestMethod(text).toString();
    }
    n;
    e;
    d;
    p;
    q;
    dmp1;
    dmq1;
    coeff;
}
function pkcs1unpad2(d, n) {
    const b = d.toByteArray();
    let i = 0;
    while(i < b.length && b[i] == 0){
        ++i;
    }
    if (b.length - i != n - 1 || b[i] != 2) {
        return null;
    }
    ++i;
    while(b[i] != 0){
        if (++i >= b.length) {
            return null;
        }
    }
    let ret = "";
    while(++i < b.length){
        const c = b[i] & 255;
        if (c < 128) {
            ret += String.fromCharCode(c);
        } else if (c > 191 && c < 224) {
            ret += String.fromCharCode((c & 31) << 6 | b[i + 1] & 63);
            ++i;
        } else {
            ret += String.fromCharCode((c & 15) << 12 | (b[i + 1] & 63) << 6 | b[i + 2] & 63);
            i += 2;
        }
    }
    return ret;
}
const DIGEST_HEADERS = {
    md2: "3020300c06082a864886f70d020205000410",
    md5: "3020300c06082a864886f70d020505000410",
    sha1: "3021300906052b0e03021a05000414",
    sha224: "302d300d06096086480165030402040500041c",
    sha256: "3031300d060960864801650304020105000420",
    sha384: "3041300d060960864801650304020205000430",
    sha512: "3051300d060960864801650304020305000440",
    ripemd160: "3021300906052b2403020105000414"
};
function getDigestHeader(name) {
    return DIGEST_HEADERS[name] || "";
}
function removeDigestHeader(str) {
    for(const name in DIGEST_HEADERS){
        if (DIGEST_HEADERS.hasOwnProperty(name)) {
            const header = DIGEST_HEADERS[name];
            const len = header.length;
            if (str.substr(0, len) == header) {
                return str.substr(len);
            }
        }
    }
    return str;
}
var YAHOO = {};
YAHOO.lang = {
    extend: function(subc, superc, overrides) {
        if (!superc || !subc) {
            throw new Error("YAHOO.lang.extend failed, please check that " + "all dependencies are included.");
        }
        var F = function() {};
        F.prototype = superc.prototype;
        subc.prototype = new F();
        subc.prototype.constructor = subc;
        subc.superclass = superc.prototype;
        if (superc.prototype.constructor == Object.prototype.constructor) {
            superc.prototype.constructor = superc;
        }
        if (overrides) {
            var i;
            for(i in overrides){
                subc.prototype[i] = overrides[i];
            }
            var _IEEnumFix = function() {}, ADD = [
                "toString",
                "valueOf"
            ];
            try {
                if (/MSIE/.test(navigator.userAgent)) {
                    _IEEnumFix = function(r, s) {
                        for(i = 0; i < ADD.length; i = i + 1){
                            var fname = ADD[i], f = s[fname];
                            if (typeof f === 'function' && f != Object.prototype[fname]) {
                                r[fname] = f;
                            }
                        }
                    };
                }
            } catch (ex) {}
            _IEEnumFix(subc.prototype, overrides);
        }
    }
};
var KJUR = {};
if (typeof KJUR.asn1 == "undefined" || !KJUR.asn1) KJUR.asn1 = {};
KJUR.asn1.ASN1Util = new function() {
    this.integerToByteHex = function(i) {
        var h = i.toString(16);
        if (h.length % 2 == 1) h = '0' + h;
        return h;
    };
    this.bigIntToMinTwosComplementsHex = function(bigIntegerValue) {
        var h = bigIntegerValue.toString(16);
        if (h.substr(0, 1) != '-') {
            if (h.length % 2 == 1) {
                h = '0' + h;
            } else {
                if (!h.match(/^[0-7]/)) {
                    h = '00' + h;
                }
            }
        } else {
            var hPos = h.substr(1);
            var xorLen = hPos.length;
            if (xorLen % 2 == 1) {
                xorLen += 1;
            } else {
                if (!h.match(/^[0-7]/)) {
                    xorLen += 2;
                }
            }
            var hMask = '';
            for(var i = 0; i < xorLen; i++){
                hMask += 'f';
            }
            var biMask = new BigInteger(hMask, 16);
            var biNeg = biMask.xor(bigIntegerValue).add(BigInteger.ONE);
            h = biNeg.toString(16).replace(/^-/, '');
        }
        return h;
    };
    this.getPEMStringFromHex = function(dataHex, pemHeader) {
        return hextopem(dataHex, pemHeader);
    };
    this.newObject = function(param) {
        var _KJUR = KJUR, _KJUR_asn1 = _KJUR.asn1, _DERBoolean = _KJUR_asn1.DERBoolean, _DERInteger = _KJUR_asn1.DERInteger, _DERBitString = _KJUR_asn1.DERBitString, _DEROctetString = _KJUR_asn1.DEROctetString, _DERNull = _KJUR_asn1.DERNull, _DERObjectIdentifier = _KJUR_asn1.DERObjectIdentifier, _DEREnumerated = _KJUR_asn1.DEREnumerated, _DERUTF8String = _KJUR_asn1.DERUTF8String, _DERNumericString = _KJUR_asn1.DERNumericString, _DERPrintableString = _KJUR_asn1.DERPrintableString, _DERTeletexString = _KJUR_asn1.DERTeletexString, _DERIA5String = _KJUR_asn1.DERIA5String, _DERUTCTime = _KJUR_asn1.DERUTCTime, _DERGeneralizedTime = _KJUR_asn1.DERGeneralizedTime, _DERSequence = _KJUR_asn1.DERSequence, _DERSet = _KJUR_asn1.DERSet, _DERTaggedObject = _KJUR_asn1.DERTaggedObject, _newObject = _KJUR_asn1.ASN1Util.newObject;
        var keys = Object.keys(param);
        if (keys.length != 1) throw "key of param shall be only one.";
        var key = keys[0];
        if (":bool:int:bitstr:octstr:null:oid:enum:utf8str:numstr:prnstr:telstr:ia5str:utctime:gentime:seq:set:tag:".indexOf(":" + key + ":") == -1) throw "undefined key: " + key;
        if (key == "bool") return new _DERBoolean(param[key]);
        if (key == "int") return new _DERInteger(param[key]);
        if (key == "bitstr") return new _DERBitString(param[key]);
        if (key == "octstr") return new _DEROctetString(param[key]);
        if (key == "null") return new _DERNull(param[key]);
        if (key == "oid") return new _DERObjectIdentifier(param[key]);
        if (key == "enum") return new _DEREnumerated(param[key]);
        if (key == "utf8str") return new _DERUTF8String(param[key]);
        if (key == "numstr") return new _DERNumericString(param[key]);
        if (key == "prnstr") return new _DERPrintableString(param[key]);
        if (key == "telstr") return new _DERTeletexString(param[key]);
        if (key == "ia5str") return new _DERIA5String(param[key]);
        if (key == "utctime") return new _DERUTCTime(param[key]);
        if (key == "gentime") return new _DERGeneralizedTime(param[key]);
        if (key == "seq") {
            var paramList = param[key];
            var a = [];
            for(var i = 0; i < paramList.length; i++){
                var asn1Obj = _newObject(paramList[i]);
                a.push(asn1Obj);
            }
            return new _DERSequence({
                'array': a
            });
        }
        if (key == "set") {
            var paramList = param[key];
            var a = [];
            for(var i = 0; i < paramList.length; i++){
                var asn1Obj = _newObject(paramList[i]);
                a.push(asn1Obj);
            }
            return new _DERSet({
                'array': a
            });
        }
        if (key == "tag") {
            var tagParam = param[key];
            if (Object.prototype.toString.call(tagParam) === '[object Array]' && tagParam.length == 3) {
                var obj = _newObject(tagParam[2]);
                return new _DERTaggedObject({
                    tag: tagParam[0],
                    explicit: tagParam[1],
                    obj: obj
                });
            } else {
                var newParam = {};
                if (tagParam.explicit !== undefined) newParam.explicit = tagParam.explicit;
                if (tagParam.tag !== undefined) newParam.tag = tagParam.tag;
                if (tagParam.obj === undefined) throw "obj shall be specified for 'tag'.";
                newParam.obj = _newObject(tagParam.obj);
                return new _DERTaggedObject(newParam);
            }
        }
    };
    this.jsonToASN1HEX = function(param) {
        var asn1Obj = this.newObject(param);
        return asn1Obj.getEncodedHex();
    };
};
KJUR.asn1.ASN1Util.oidHexToInt = function(hex) {
    var s = "";
    var i01 = parseInt(hex.substr(0, 2), 16);
    var i0 = Math.floor(i01 / 40);
    var i1 = i01 % 40;
    var s = i0 + "." + i1;
    var binbuf = "";
    for(var i = 2; i < hex.length; i += 2){
        var value = parseInt(hex.substr(i, 2), 16);
        var bin = ("00000000" + value.toString(2)).slice(-8);
        binbuf = binbuf + bin.substr(1, 7);
        if (bin.substr(0, 1) == "0") {
            var bi = new BigInteger(binbuf, 2);
            s = s + "." + bi.toString(10);
            binbuf = "";
        }
    }
    return s;
};
KJUR.asn1.ASN1Util.oidIntToHex = function(oidString) {
    var itox = function(i) {
        var h = i.toString(16);
        if (h.length == 1) h = '0' + h;
        return h;
    };
    var roidtox = function(roid) {
        var h = '';
        var bi = new BigInteger(roid, 10);
        var b = bi.toString(2);
        var padLen = 7 - b.length % 7;
        if (padLen == 7) padLen = 0;
        var bPad = '';
        for(var i = 0; i < padLen; i++)bPad += '0';
        b = bPad + b;
        for(var i = 0; i < b.length - 1; i += 7){
            var b8 = b.substr(i, 7);
            if (i != b.length - 7) b8 = '1' + b8;
            h += itox(parseInt(b8, 2));
        }
        return h;
    };
    if (!oidString.match(/^[0-9.]+$/)) {
        throw "malformed oid string: " + oidString;
    }
    var h = '';
    var a = oidString.split('.');
    var i0 = parseInt(a[0]) * 40 + parseInt(a[1]);
    h += itox(i0);
    a.splice(0, 2);
    for(var i = 0; i < a.length; i++){
        h += roidtox(a[i]);
    }
    return h;
};
KJUR.asn1.ASN1Object = function() {
    var hV = '';
    this.getLengthHexFromValue = function() {
        if (typeof this.hV == "undefined" || this.hV == null) {
            throw "this.hV is null or undefined.";
        }
        if (this.hV.length % 2 == 1) {
            throw "value hex must be even length: n=" + hV.length + ",v=" + this.hV;
        }
        var n = this.hV.length / 2;
        var hN = n.toString(16);
        if (hN.length % 2 == 1) {
            hN = "0" + hN;
        }
        if (n < 128) {
            return hN;
        } else {
            var hNlen = hN.length / 2;
            if (hNlen > 15) {
                throw "ASN.1 length too long to represent by 8x: n = " + n.toString(16);
            }
            var head = 128 + hNlen;
            return head.toString(16) + hN;
        }
    };
    this.getEncodedHex = function() {
        if (this.hTLV == null || this.isModified) {
            this.hV = this.getFreshValueHex();
            this.hL = this.getLengthHexFromValue();
            this.hTLV = this.hT + this.hL + this.hV;
            this.isModified = false;
        }
        return this.hTLV;
    };
    this.getValueHex = function() {
        this.getEncodedHex();
        return this.hV;
    };
    this.getFreshValueHex = function() {
        return '';
    };
};
KJUR.asn1.DERAbstractString = function(params) {
    KJUR.asn1.DERAbstractString.superclass.constructor.call(this);
    this.getString = function() {
        return this.s;
    };
    this.setString = function(newS) {
        this.hTLV = null;
        this.isModified = true;
        this.s = newS;
        this.hV = stohex(this.s);
    };
    this.setStringHex = function(newHexString) {
        this.hTLV = null;
        this.isModified = true;
        this.s = null;
        this.hV = newHexString;
    };
    this.getFreshValueHex = function() {
        return this.hV;
    };
    if (typeof params != "undefined") {
        if (typeof params == "string") {
            this.setString(params);
        } else if (typeof params['str'] != "undefined") {
            this.setString(params['str']);
        } else if (typeof params['hex'] != "undefined") {
            this.setStringHex(params['hex']);
        }
    }
};
YAHOO.lang.extend(KJUR.asn1.DERAbstractString, KJUR.asn1.ASN1Object);
KJUR.asn1.DERAbstractTime = function(params) {
    KJUR.asn1.DERAbstractTime.superclass.constructor.call(this);
    this.localDateToUTC = function(d) {
        utc = d.getTime() + d.getTimezoneOffset() * 60000;
        var utcDate = new Date(utc);
        return utcDate;
    };
    this.formatDate = function(dateObject, type, withMillis) {
        var pad = this.zeroPadding;
        var d = this.localDateToUTC(dateObject);
        var year = String(d.getFullYear());
        if (type == 'utc') year = year.substr(2, 2);
        var month = pad(String(d.getMonth() + 1), 2);
        var day = pad(String(d.getDate()), 2);
        var hour = pad(String(d.getHours()), 2);
        var min = pad(String(d.getMinutes()), 2);
        var sec = pad(String(d.getSeconds()), 2);
        var s = year + month + day + hour + min + sec;
        if (withMillis === true) {
            var millis = d.getMilliseconds();
            if (millis != 0) {
                var sMillis = pad(String(millis), 3);
                sMillis = sMillis.replace(/[0]+$/, "");
                s = s + "." + sMillis;
            }
        }
        return s + "Z";
    };
    this.zeroPadding = function(s, len) {
        if (s.length >= len) return s;
        return new Array(len - s.length + 1).join('0') + s;
    };
    this.getString = function() {
        return this.s;
    };
    this.setString = function(newS) {
        this.hTLV = null;
        this.isModified = true;
        this.s = newS;
        this.hV = stohex(newS);
    };
    this.setByDateValue = function(year, month, day, hour, min, sec) {
        var dateObject = new Date(Date.UTC(year, month - 1, day, hour, min, sec, 0));
        this.setByDate(dateObject);
    };
    this.getFreshValueHex = function() {
        return this.hV;
    };
};
YAHOO.lang.extend(KJUR.asn1.DERAbstractTime, KJUR.asn1.ASN1Object);
KJUR.asn1.DERAbstractStructured = function(params) {
    KJUR.asn1.DERAbstractString.superclass.constructor.call(this);
    this.setByASN1ObjectArray = function(asn1ObjectArray) {
        this.hTLV = null;
        this.isModified = true;
        this.asn1Array = asn1ObjectArray;
    };
    this.appendASN1Object = function(asn1Object) {
        this.hTLV = null;
        this.isModified = true;
        this.asn1Array.push(asn1Object);
    };
    this.asn1Array = new Array();
    if (typeof params != "undefined") {
        if (typeof params['array'] != "undefined") {
            this.asn1Array = params['array'];
        }
    }
};
YAHOO.lang.extend(KJUR.asn1.DERAbstractStructured, KJUR.asn1.ASN1Object);
KJUR.asn1.DERBoolean = function() {
    KJUR.asn1.DERBoolean.superclass.constructor.call(this);
    this.hT = "01";
    this.hTLV = "0101ff";
};
YAHOO.lang.extend(KJUR.asn1.DERBoolean, KJUR.asn1.ASN1Object);
KJUR.asn1.DERInteger = function(params) {
    KJUR.asn1.DERInteger.superclass.constructor.call(this);
    this.hT = "02";
    this.setByBigInteger = function(bigIntegerValue) {
        this.hTLV = null;
        this.isModified = true;
        this.hV = KJUR.asn1.ASN1Util.bigIntToMinTwosComplementsHex(bigIntegerValue);
    };
    this.setByInteger = function(intValue) {
        var bi = new BigInteger(String(intValue), 10);
        this.setByBigInteger(bi);
    };
    this.setValueHex = function(newHexString) {
        this.hV = newHexString;
    };
    this.getFreshValueHex = function() {
        return this.hV;
    };
    if (typeof params != "undefined") {
        if (typeof params['bigint'] != "undefined") {
            this.setByBigInteger(params['bigint']);
        } else if (typeof params['int'] != "undefined") {
            this.setByInteger(params['int']);
        } else if (typeof params == "number") {
            this.setByInteger(params);
        } else if (typeof params['hex'] != "undefined") {
            this.setValueHex(params['hex']);
        }
    }
};
YAHOO.lang.extend(KJUR.asn1.DERInteger, KJUR.asn1.ASN1Object);
KJUR.asn1.DERBitString = function(params) {
    if (params !== undefined && typeof params.obj !== "undefined") {
        var o = KJUR.asn1.ASN1Util.newObject(params.obj);
        params.hex = "00" + o.getEncodedHex();
    }
    KJUR.asn1.DERBitString.superclass.constructor.call(this);
    this.hT = "03";
    this.setHexValueIncludingUnusedBits = function(newHexStringIncludingUnusedBits) {
        this.hTLV = null;
        this.isModified = true;
        this.hV = newHexStringIncludingUnusedBits;
    };
    this.setUnusedBitsAndHexValue = function(unusedBits, hValue) {
        if (unusedBits < 0 || 7 < unusedBits) {
            throw "unused bits shall be from 0 to 7: u = " + unusedBits;
        }
        var hUnusedBits = "0" + unusedBits;
        this.hTLV = null;
        this.isModified = true;
        this.hV = hUnusedBits + hValue;
    };
    this.setByBinaryString = function(binaryString) {
        binaryString = binaryString.replace(/0+$/, '');
        var unusedBits = 8 - binaryString.length % 8;
        if (unusedBits == 8) unusedBits = 0;
        for(var i = 0; i <= unusedBits; i++){
            binaryString += '0';
        }
        var h = '';
        for(var i = 0; i < binaryString.length - 1; i += 8){
            var b = binaryString.substr(i, 8);
            var x = parseInt(b, 2).toString(16);
            if (x.length == 1) x = '0' + x;
            h += x;
        }
        this.hTLV = null;
        this.isModified = true;
        this.hV = '0' + unusedBits + h;
    };
    this.setByBooleanArray = function(booleanArray) {
        var s = '';
        for(var i = 0; i < booleanArray.length; i++){
            if (booleanArray[i] == true) {
                s += '1';
            } else {
                s += '0';
            }
        }
        this.setByBinaryString(s);
    };
    this.newFalseArray = function(nLength) {
        var a = new Array(nLength);
        for(var i = 0; i < nLength; i++){
            a[i] = false;
        }
        return a;
    };
    this.getFreshValueHex = function() {
        return this.hV;
    };
    if (typeof params != "undefined") {
        if (typeof params == "string" && params.toLowerCase().match(/^[0-9a-f]+$/)) {
            this.setHexValueIncludingUnusedBits(params);
        } else if (typeof params['hex'] != "undefined") {
            this.setHexValueIncludingUnusedBits(params['hex']);
        } else if (typeof params['bin'] != "undefined") {
            this.setByBinaryString(params['bin']);
        } else if (typeof params['array'] != "undefined") {
            this.setByBooleanArray(params['array']);
        }
    }
};
YAHOO.lang.extend(KJUR.asn1.DERBitString, KJUR.asn1.ASN1Object);
KJUR.asn1.DEROctetString = function(params) {
    if (params !== undefined && typeof params.obj !== "undefined") {
        var o = KJUR.asn1.ASN1Util.newObject(params.obj);
        params.hex = o.getEncodedHex();
    }
    KJUR.asn1.DEROctetString.superclass.constructor.call(this, params);
    this.hT = "04";
};
YAHOO.lang.extend(KJUR.asn1.DEROctetString, KJUR.asn1.DERAbstractString);
KJUR.asn1.DERNull = function() {
    KJUR.asn1.DERNull.superclass.constructor.call(this);
    this.hT = "05";
    this.hTLV = "0500";
};
YAHOO.lang.extend(KJUR.asn1.DERNull, KJUR.asn1.ASN1Object);
KJUR.asn1.DERObjectIdentifier = function(params) {
    var itox = function(i) {
        var h = i.toString(16);
        if (h.length == 1) h = '0' + h;
        return h;
    };
    var roidtox = function(roid) {
        var h = '';
        var bi = new BigInteger(roid, 10);
        var b = bi.toString(2);
        var padLen = 7 - b.length % 7;
        if (padLen == 7) padLen = 0;
        var bPad = '';
        for(var i = 0; i < padLen; i++)bPad += '0';
        b = bPad + b;
        for(var i = 0; i < b.length - 1; i += 7){
            var b8 = b.substr(i, 7);
            if (i != b.length - 7) b8 = '1' + b8;
            h += itox(parseInt(b8, 2));
        }
        return h;
    };
    KJUR.asn1.DERObjectIdentifier.superclass.constructor.call(this);
    this.hT = "06";
    this.setValueHex = function(newHexString) {
        this.hTLV = null;
        this.isModified = true;
        this.s = null;
        this.hV = newHexString;
    };
    this.setValueOidString = function(oidString) {
        if (!oidString.match(/^[0-9.]+$/)) {
            throw "malformed oid string: " + oidString;
        }
        var h = '';
        var a = oidString.split('.');
        var i0 = parseInt(a[0]) * 40 + parseInt(a[1]);
        h += itox(i0);
        a.splice(0, 2);
        for(var i = 0; i < a.length; i++){
            h += roidtox(a[i]);
        }
        this.hTLV = null;
        this.isModified = true;
        this.s = null;
        this.hV = h;
    };
    this.setValueName = function(oidName) {
        var oid = KJUR.asn1.x509.OID.name2oid(oidName);
        if (oid !== '') {
            this.setValueOidString(oid);
        } else {
            throw "DERObjectIdentifier oidName undefined: " + oidName;
        }
    };
    this.getFreshValueHex = function() {
        return this.hV;
    };
    if (params !== undefined) {
        if (typeof params === "string") {
            if (params.match(/^[0-2].[0-9.]+$/)) {
                this.setValueOidString(params);
            } else {
                this.setValueName(params);
            }
        } else if (params.oid !== undefined) {
            this.setValueOidString(params.oid);
        } else if (params.hex !== undefined) {
            this.setValueHex(params.hex);
        } else if (params.name !== undefined) {
            this.setValueName(params.name);
        }
    }
};
YAHOO.lang.extend(KJUR.asn1.DERObjectIdentifier, KJUR.asn1.ASN1Object);
KJUR.asn1.DEREnumerated = function(params) {
    KJUR.asn1.DEREnumerated.superclass.constructor.call(this);
    this.hT = "0a";
    this.setByBigInteger = function(bigIntegerValue) {
        this.hTLV = null;
        this.isModified = true;
        this.hV = KJUR.asn1.ASN1Util.bigIntToMinTwosComplementsHex(bigIntegerValue);
    };
    this.setByInteger = function(intValue) {
        var bi = new BigInteger(String(intValue), 10);
        this.setByBigInteger(bi);
    };
    this.setValueHex = function(newHexString) {
        this.hV = newHexString;
    };
    this.getFreshValueHex = function() {
        return this.hV;
    };
    if (typeof params != "undefined") {
        if (typeof params['int'] != "undefined") {
            this.setByInteger(params['int']);
        } else if (typeof params == "number") {
            this.setByInteger(params);
        } else if (typeof params['hex'] != "undefined") {
            this.setValueHex(params['hex']);
        }
    }
};
YAHOO.lang.extend(KJUR.asn1.DEREnumerated, KJUR.asn1.ASN1Object);
KJUR.asn1.DERUTF8String = function(params) {
    KJUR.asn1.DERUTF8String.superclass.constructor.call(this, params);
    this.hT = "0c";
};
YAHOO.lang.extend(KJUR.asn1.DERUTF8String, KJUR.asn1.DERAbstractString);
KJUR.asn1.DERNumericString = function(params) {
    KJUR.asn1.DERNumericString.superclass.constructor.call(this, params);
    this.hT = "12";
};
YAHOO.lang.extend(KJUR.asn1.DERNumericString, KJUR.asn1.DERAbstractString);
KJUR.asn1.DERPrintableString = function(params) {
    KJUR.asn1.DERPrintableString.superclass.constructor.call(this, params);
    this.hT = "13";
};
YAHOO.lang.extend(KJUR.asn1.DERPrintableString, KJUR.asn1.DERAbstractString);
KJUR.asn1.DERTeletexString = function(params) {
    KJUR.asn1.DERTeletexString.superclass.constructor.call(this, params);
    this.hT = "14";
};
YAHOO.lang.extend(KJUR.asn1.DERTeletexString, KJUR.asn1.DERAbstractString);
KJUR.asn1.DERIA5String = function(params) {
    KJUR.asn1.DERIA5String.superclass.constructor.call(this, params);
    this.hT = "16";
};
YAHOO.lang.extend(KJUR.asn1.DERIA5String, KJUR.asn1.DERAbstractString);
KJUR.asn1.DERUTCTime = function(params) {
    KJUR.asn1.DERUTCTime.superclass.constructor.call(this, params);
    this.hT = "17";
    this.setByDate = function(dateObject) {
        this.hTLV = null;
        this.isModified = true;
        this.date = dateObject;
        this.s = this.formatDate(this.date, 'utc');
        this.hV = stohex(this.s);
    };
    this.getFreshValueHex = function() {
        if (typeof this.date == "undefined" && typeof this.s == "undefined") {
            this.date = new Date();
            this.s = this.formatDate(this.date, 'utc');
            this.hV = stohex(this.s);
        }
        return this.hV;
    };
    if (params !== undefined) {
        if (params.str !== undefined) {
            this.setString(params.str);
        } else if (typeof params == "string" && params.match(/^[0-9]{12}Z$/)) {
            this.setString(params);
        } else if (params.hex !== undefined) {
            this.setStringHex(params.hex);
        } else if (params.date !== undefined) {
            this.setByDate(params.date);
        }
    }
};
YAHOO.lang.extend(KJUR.asn1.DERUTCTime, KJUR.asn1.DERAbstractTime);
KJUR.asn1.DERGeneralizedTime = function(params) {
    KJUR.asn1.DERGeneralizedTime.superclass.constructor.call(this, params);
    this.hT = "18";
    this.withMillis = false;
    this.setByDate = function(dateObject) {
        this.hTLV = null;
        this.isModified = true;
        this.date = dateObject;
        this.s = this.formatDate(this.date, 'gen', this.withMillis);
        this.hV = stohex(this.s);
    };
    this.getFreshValueHex = function() {
        if (this.date === undefined && this.s === undefined) {
            this.date = new Date();
            this.s = this.formatDate(this.date, 'gen', this.withMillis);
            this.hV = stohex(this.s);
        }
        return this.hV;
    };
    if (params !== undefined) {
        if (params.str !== undefined) {
            this.setString(params.str);
        } else if (typeof params == "string" && params.match(/^[0-9]{14}Z$/)) {
            this.setString(params);
        } else if (params.hex !== undefined) {
            this.setStringHex(params.hex);
        } else if (params.date !== undefined) {
            this.setByDate(params.date);
        }
        if (params.millis === true) {
            this.withMillis = true;
        }
    }
};
YAHOO.lang.extend(KJUR.asn1.DERGeneralizedTime, KJUR.asn1.DERAbstractTime);
KJUR.asn1.DERSequence = function(params) {
    KJUR.asn1.DERSequence.superclass.constructor.call(this, params);
    this.hT = "30";
    this.getFreshValueHex = function() {
        var h = '';
        for(var i = 0; i < this.asn1Array.length; i++){
            var asn1Obj = this.asn1Array[i];
            h += asn1Obj.getEncodedHex();
        }
        this.hV = h;
        return this.hV;
    };
};
YAHOO.lang.extend(KJUR.asn1.DERSequence, KJUR.asn1.DERAbstractStructured);
KJUR.asn1.DERSet = function(params) {
    KJUR.asn1.DERSet.superclass.constructor.call(this, params);
    this.hT = "31";
    this.sortFlag = true;
    this.getFreshValueHex = function() {
        var a = new Array();
        for(var i = 0; i < this.asn1Array.length; i++){
            var asn1Obj = this.asn1Array[i];
            a.push(asn1Obj.getEncodedHex());
        }
        if (this.sortFlag == true) a.sort();
        this.hV = a.join('');
        return this.hV;
    };
    if (typeof params != "undefined") {
        if (typeof params.sortflag != "undefined" && params.sortflag == false) this.sortFlag = false;
    }
};
YAHOO.lang.extend(KJUR.asn1.DERSet, KJUR.asn1.DERAbstractStructured);
KJUR.asn1.DERTaggedObject = function(params) {
    KJUR.asn1.DERTaggedObject.superclass.constructor.call(this);
    this.hT = "a0";
    this.hV = '';
    this.isExplicit = true;
    this.asn1Object = null;
    this.setASN1Object = function(isExplicitFlag, tagNoHex, asn1Object) {
        this.hT = tagNoHex;
        this.isExplicit = isExplicitFlag;
        this.asn1Object = asn1Object;
        if (this.isExplicit) {
            this.hV = this.asn1Object.getEncodedHex();
            this.hTLV = null;
            this.isModified = true;
        } else {
            this.hV = null;
            this.hTLV = asn1Object.getEncodedHex();
            this.hTLV = this.hTLV.replace(/^../, tagNoHex);
            this.isModified = false;
        }
    };
    this.getFreshValueHex = function() {
        return this.hV;
    };
    if (typeof params != "undefined") {
        if (typeof params['tag'] != "undefined") {
            this.hT = params['tag'];
        }
        if (typeof params['explicit'] != "undefined") {
            this.isExplicit = params['explicit'];
        }
        if (typeof params['obj'] != "undefined") {
            this.asn1Object = params['obj'];
            this.setASN1Object(this.isExplicit, this.hT, this.asn1Object);
        }
    }
};
YAHOO.lang.extend(KJUR.asn1.DERTaggedObject, KJUR.asn1.ASN1Object);
class JSEncryptRSAKey extends RSAKey {
    constructor(key){
        super();
        if (key) {
            if (typeof key === "string") {
                this.parseKey(key);
            } else if (JSEncryptRSAKey.hasPrivateKeyProperty(key) || JSEncryptRSAKey.hasPublicKeyProperty(key)) {
                this.parsePropertiesFrom(key);
            }
        }
    }
    parseKey(pem) {
        try {
            let modulus = 0;
            let public_exponent = 0;
            const reHex = /^\s*(?:[0-9A-Fa-f][0-9A-Fa-f]\s*)+$/;
            const der = reHex.test(pem) ? Hex.decode(pem) : Base64.unarmor(pem);
            let asn1 = ASN1.decode(der);
            if (asn1.sub.length === 3) {
                asn1 = asn1.sub[2].sub[0];
            }
            if (asn1.sub.length === 9) {
                modulus = asn1.sub[1].getHexStringValue();
                this.n = parseBigInt(modulus, 16);
                public_exponent = asn1.sub[2].getHexStringValue();
                this.e = parseInt(public_exponent, 16);
                const private_exponent = asn1.sub[3].getHexStringValue();
                this.d = parseBigInt(private_exponent, 16);
                const prime1 = asn1.sub[4].getHexStringValue();
                this.p = parseBigInt(prime1, 16);
                const prime2 = asn1.sub[5].getHexStringValue();
                this.q = parseBigInt(prime2, 16);
                const exponent1 = asn1.sub[6].getHexStringValue();
                this.dmp1 = parseBigInt(exponent1, 16);
                const exponent2 = asn1.sub[7].getHexStringValue();
                this.dmq1 = parseBigInt(exponent2, 16);
                const coefficient = asn1.sub[8].getHexStringValue();
                this.coeff = parseBigInt(coefficient, 16);
            } else if (asn1.sub.length === 2) {
                if (asn1.sub[0].sub) {
                    var bit_string = asn1.sub[1];
                    var sequence = bit_string.sub[0];
                    modulus = sequence.sub[0].getHexStringValue();
                    this.n = parseBigInt(modulus, 16);
                    public_exponent = sequence.sub[1].getHexStringValue();
                    this.e = parseInt(public_exponent, 16);
                } else {
                    modulus = asn1.sub[0].getHexStringValue();
                    this.n = parseBigInt(modulus, 16);
                    public_exponent = asn1.sub[1].getHexStringValue();
                    this.e = parseInt(public_exponent, 16);
                }
            } else {
                return false;
            }
            return true;
        } catch (ex) {
            return false;
        }
    }
    getPrivateBaseKey() {
        const options = {
            array: [
                new KJUR.asn1.DERInteger({
                    int: 0
                }),
                new KJUR.asn1.DERInteger({
                    bigint: this.n
                }),
                new KJUR.asn1.DERInteger({
                    int: this.e
                }),
                new KJUR.asn1.DERInteger({
                    bigint: this.d
                }),
                new KJUR.asn1.DERInteger({
                    bigint: this.p
                }),
                new KJUR.asn1.DERInteger({
                    bigint: this.q
                }),
                new KJUR.asn1.DERInteger({
                    bigint: this.dmp1
                }),
                new KJUR.asn1.DERInteger({
                    bigint: this.dmq1
                }),
                new KJUR.asn1.DERInteger({
                    bigint: this.coeff
                })
            ]
        };
        const seq = new KJUR.asn1.DERSequence(options);
        return seq.getEncodedHex();
    }
    getPrivateBaseKeyB64() {
        return hex2b64(this.getPrivateBaseKey());
    }
    getPublicBaseKey() {
        const first_sequence = new KJUR.asn1.DERSequence({
            array: [
                new KJUR.asn1.DERObjectIdentifier({
                    oid: "1.2.840.113549.1.1.1"
                }),
                new KJUR.asn1.DERNull()
            ]
        });
        const second_sequence = new KJUR.asn1.DERSequence({
            array: [
                new KJUR.asn1.DERInteger({
                    bigint: this.n
                }),
                new KJUR.asn1.DERInteger({
                    int: this.e
                })
            ]
        });
        const bit_string = new KJUR.asn1.DERBitString({
            hex: "00" + second_sequence.getEncodedHex()
        });
        const seq = new KJUR.asn1.DERSequence({
            array: [
                first_sequence,
                bit_string
            ]
        });
        return seq.getEncodedHex();
    }
    getPublicBaseKeyB64() {
        return hex2b64(this.getPublicBaseKey());
    }
    static wordwrap(str, width) {
        width = width || 64;
        if (!str) {
            return str;
        }
        const regex = "(.{1," + width + "})( +|$\n?)|(.{1," + width + "})";
        return str.match(RegExp(regex, "g")).join("\n");
    }
    getPrivateKey() {
        let key = "-----BEGIN RSA PRIVATE KEY-----\n";
        key += JSEncryptRSAKey.wordwrap(this.getPrivateBaseKeyB64()) + "\n";
        key += "-----END RSA PRIVATE KEY-----";
        return key;
    }
    getPublicKey() {
        let key = "-----BEGIN PUBLIC KEY-----\n";
        key += JSEncryptRSAKey.wordwrap(this.getPublicBaseKeyB64()) + "\n";
        key += "-----END PUBLIC KEY-----";
        return key;
    }
    static hasPublicKeyProperty(obj) {
        obj = obj || {};
        return obj.hasOwnProperty("n") && obj.hasOwnProperty("e");
    }
    static hasPrivateKeyProperty(obj) {
        obj = obj || {};
        return obj.hasOwnProperty("n") && obj.hasOwnProperty("e") && obj.hasOwnProperty("d") && obj.hasOwnProperty("p") && obj.hasOwnProperty("q") && obj.hasOwnProperty("dmp1") && obj.hasOwnProperty("dmq1") && obj.hasOwnProperty("coeff");
    }
    parsePropertiesFrom(obj) {
        this.n = obj.n;
        this.e = obj.e;
        if (obj.hasOwnProperty("d")) {
            this.d = obj.d;
            this.p = obj.p;
            this.q = obj.q;
            this.dmp1 = obj.dmp1;
            this.dmq1 = obj.dmq1;
            this.coeff = obj.coeff;
        }
    }
}
const version = typeof process !== 'undefined' ? process.env?.npm_package_version : undefined;
class JSEncrypt {
    constructor(options = {}){
        options = options || {};
        this.default_key_size = options.default_key_size ? parseInt(options.default_key_size, 10) : 1024;
        this.default_public_exponent = options.default_public_exponent || "010001";
        this.log = options.log || false;
        this.key = null;
    }
    default_key_size;
    default_public_exponent;
    log;
    key;
    static version = version;
    setKey(key) {
        if (this.log && this.key) {
            console.warn("A key was already set, overriding existing.");
        }
        this.key = new JSEncryptRSAKey(key);
    }
    setPrivateKey(privkey) {
        this.setKey(privkey);
    }
    setPublicKey(pubkey) {
        this.setKey(pubkey);
    }
    decrypt(str) {
        try {
            return this.getKey().decrypt(b64tohex(str));
        } catch (ex) {
            return false;
        }
    }
    encrypt(str) {
        try {
            return hex2b64(this.getKey().encrypt(str));
        } catch (ex) {
            return false;
        }
    }
    sign(str, digestMethod, digestName) {
        try {
            return hex2b64(this.getKey().sign(str, digestMethod, digestName));
        } catch (ex) {
            return false;
        }
    }
    verify(str, signature, digestMethod) {
        try {
            return this.getKey().verify(str, b64tohex(signature), digestMethod);
        } catch (ex) {
            return false;
        }
    }
    getKey(cb) {
        if (!this.key) {
            this.key = new JSEncryptRSAKey();
            if (cb && ({}).toString.call(cb) === "[object Function]") {
                this.key.generateAsync(this.default_key_size, this.default_public_exponent, cb);
                return;
            }
            this.key.generate(this.default_key_size, this.default_public_exponent);
        }
        return this.key;
    }
    getPrivateKey() {
        return this.getKey().getPrivateKey();
    }
    getPrivateKeyB64() {
        return this.getKey().getPrivateBaseKeyB64();
    }
    getPublicKey() {
        return this.getKey().getPublicKey();
    }
    getPublicKeyB64() {
        return this.getKey().getPublicBaseKeyB64();
    }
}
export { JSEncrypt as JSEncrypt, JSEncryptRSAKey as JSEncryptRSAKey, __default as ASN, __default1 as JSBN, Base64 as Base64 };
export { JSEncrypt as default };
