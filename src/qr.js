export default(function(d){"use strict";var G,H=[0,26,44,70,100,134,172,196,242,292,346,404,466,532,581,655,733,815,901,991,1085,1156,1258,1364,1474,1588,1706,1828,1921,2051,2185,2323,2465,2611,2761,2876,3034,3196,3362,3532,3706],y=function(a){if(!a)throw new Error('"version" cannot be null or undefined');if(a<1||a>40)throw new Error('"version" should be in range from 1 to 40');return 4*a+17},I=function(a){return H[a]},z=function(a){for(var b=0;0!==a;)b++,a>>>=1;return b},J=function(a){if("function"!=typeof a)throw new Error('"toSJISFunc" is not a valid function.');G=a},K=function(){return void 0!==G},L=function(a){return G(a)};function a(b,a){return b(a={exports:{}},a.exports),a.exports}var e=a(function(b,a){a.L={bit:1},a.M={bit:0},a.Q={bit:3},a.H={bit:2},a.isValid=function(a){return a&& void 0!==a.bit&&a.bit>=0&&a.bit<4},a.from=function(b,c){if(a.isValid(b))return b;try{return function(b){if("string"!=typeof b)throw new Error("Param is not a string");switch(b.toLowerCase()){case"l":case"low":return a.L;case"m":case"medium":return a.M;case"q":case"quartile":return a.Q;case"h":case"high":return a.H;default:throw new Error("Unknown EC Level: "+b)}}(b)}catch(d){return c}}});function s(){this.buffer=[],this.length=0}e.L,e.M,e.Q,e.H,e.isValid,s.prototype={get:function(a){return 1==(this.buffer[Math.floor(a/8)]>>>7-a%8&1)},put:function(c,b){for(var a=0;a<b;a++)this.putBit(1==(c>>>b-a-1&1))},getLengthInBits:function(){return this.length},putBit:function(b){var a=Math.floor(this.length/8);this.buffer.length<=a&&this.buffer.push(0),b&&(this.buffer[a]|=128>>>this.length%8),this.length++}};var M=s;function f(a){if(!a||a<1)throw new Error("BitMatrix size must be defined and greater than 0");this.size=a,this.data=new Uint8Array(a*a),this.reservedBit=new Uint8Array(a*a)}f.prototype.set=function(b,c,d,e){var a=b*this.size+c;this.data[a]=d,e&&(this.reservedBit[a]=!0)},f.prototype.get=function(a,b){return this.data[a*this.size+b]},f.prototype.xor=function(a,b,c){this.data[a*this.size+b]^=c},f.prototype.isReserved=function(a,b){return this.reservedBit[a*this.size+b]};var N=f,t=a(function(b,a){var c=y;a.getRowColCoords=function(d){if(1===d)return[];for(var f=Math.floor(d/7)+2,e=c(d),g=145===e?26:2*Math.ceil((e-13)/(2*f-2)),a=[e-7],b=1;b<f-1;b++)a[b]=a[b-1]-g;return a.push(6),a.reverse()},a.getPositions=function(g){for(var f=[],e=a.getRowColCoords(g),d=e.length,b=0;b<d;b++)for(var c=0;c<d;c++)0===b&&0===c||0===b&&c===d-1||b===d-1&&0===c||f.push([e[b],e[c]]);return f}});t.getRowColCoords,t.getPositions;var O=y,P=function(b){var a=O(b);return[[0,0],[a-7,0],[0,a-7]]},b=a(function(b,a){function c(d,b,c){switch(d){case a.Patterns.PATTERN000:return(b+c)%2==0;case a.Patterns.PATTERN001:return b%2==0;case a.Patterns.PATTERN010:return c%3==0;case a.Patterns.PATTERN011:return(b+c)%3==0;case a.Patterns.PATTERN100:return(Math.floor(b/2)+Math.floor(c/3))%2==0;case a.Patterns.PATTERN101:return b*c%2+b*c%3==0;case a.Patterns.PATTERN110:return(b*c%2+b*c%3)%2==0;case a.Patterns.PATTERN111:return(b*c%3+(b+c)%2)%2==0;default:throw new Error("bad maskPattern:"+d)}}a.Patterns={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7},a.isValid=function(a){return null!=a&&""!==a&&!isNaN(a)&&a>=0&&a<=7},a.from=function(b){return a.isValid(b)?parseInt(b,10):void 0},a.getPenaltyN1=function(g){for(var j=g.size,c=0,a=0,b=0,h=null,i=null,d=0;d<j;d++){a=b=0,h=i=null;for(var e=0;e<j;e++){var f=g.get(d,e);f===h?a++:(a>=5&&(c+=3+(a-5)),h=f,a=1),(f=g.get(e,d))===i?b++:(b>=5&&(c+=3+(b-5)),i=f,b=1)}a>=5&&(c+=3+(a-5)),b>=5&&(c+=3+(b-5))}return c},a.getPenaltyN2=function(c){for(var d=c.size,e=0,a=0;a<d-1;a++)for(var b=0;b<d-1;b++){var f=c.get(a,b)+c.get(a,b+1)+c.get(a+1,b)+c.get(a+1,b+1);4!==f&&0!==f||e++}return 3*e},a.getPenaltyN3=function(e){for(var g=e.size,f=0,b=0,c=0,d=0;d<g;d++){b=c=0;for(var a=0;a<g;a++)b=b<<1&2047|e.get(d,a),a>=10&&(1488===b||93===b)&&f++,c=c<<1&2047|e.get(a,d),a>=10&&(1488===c||93===c)&&f++}return 40*f},a.getPenaltyN4=function(b){for(var c=0,d=b.data.length,a=0;a<d;a++)c+=b.data[a];return 10*Math.abs(Math.ceil(100*c/d/5)-10)},a.applyMask=function(f,d){for(var e=d.size,a=0;a<e;a++)for(var b=0;b<e;b++)d.isReserved(b,a)||d.xor(b,a,c(f,b,a))},a.getBestMask=function(b,g){for(var h=Object.keys(a.Patterns).length,d=0,e=1/0,c=0;c<h;c++){g(c),a.applyMask(c,b);var f=a.getPenaltyN1(b)+a.getPenaltyN2(b)+a.getPenaltyN3(b)+a.getPenaltyN4(b);a.applyMask(c,b),f<e&&(e=f,d=c)}return d}});b.Patterns,b.isValid,b.getPenaltyN1,b.getPenaltyN2,b.getPenaltyN3,b.getPenaltyN4,b.applyMask,b.getBestMask;var Q=[1,1,1,1,1,1,1,1,1,1,2,2,1,2,2,4,1,2,4,4,2,4,4,4,2,4,6,5,2,4,6,6,2,5,8,8,4,5,8,8,4,5,8,11,4,8,10,11,4,9,12,16,4,9,16,16,6,10,12,18,6,10,17,16,6,11,16,19,6,13,18,21,7,14,21,25,8,16,20,25,8,17,23,25,9,17,23,34,9,18,25,30,10,20,27,32,12,21,29,35,12,23,34,37,12,25,34,40,13,26,35,42,14,28,38,45,15,29,40,48,16,31,43,51,17,33,45,54,18,35,48,57,19,37,51,60,19,38,53,63,20,40,56,66,21,43,59,70,22,45,62,74,24,47,65,77,25,49,68,81],R=[7,10,13,17,10,16,22,28,15,26,36,44,20,36,52,64,26,48,72,88,36,64,96,112,40,72,108,130,48,88,132,156,60,110,160,192,72,130,192,224,80,150,224,264,96,176,260,308,104,198,288,352,120,216,320,384,132,240,360,432,144,280,408,480,168,308,448,532,180,338,504,588,196,364,546,650,224,416,600,700,224,442,644,750,252,476,690,816,270,504,750,900,300,560,810,960,312,588,870,1050,336,644,952,1110,360,700,1020,1200,390,728,1050,1260,420,784,1140,1350,450,812,1200,1440,480,868,1290,1530,510,924,1350,1620,540,980,1440,1710,570,1036,1530,1800,570,1064,1590,1890,600,1120,1680,1980,630,1204,1770,2100,660,1260,1860,2220,720,1316,1950,2310,750,1372,2040,2430],S=function(a,b){switch(b){case e.L:return Q[4*(a-1)+0];case e.M:return Q[4*(a-1)+1];case e.Q:return Q[4*(a-1)+2];case e.H:return Q[4*(a-1)+3];default:return}},T=function(a,b){switch(b){case e.L:return R[4*(a-1)+0];case e.M:return R[4*(a-1)+1];case e.Q:return R[4*(a-1)+2];case e.H:return R[4*(a-1)+3];default:return}},U=new Uint8Array(512),V=new Uint8Array(256);!function(){for(var a=1,b=0;b<255;b++)U[b]=a,V[a]=b,256&(a<<=1)&&(a^=285);for(var c=255;c<512;c++)U[c]=U[c-255]}();var W=function(a,b){return 0===a||0===b?0:U[V[a]+V[b]]},n=a(function(b,a){a.mul=function(c,d){for(var e=new Uint8Array(c.length+d.length-1),a=0;a<c.length;a++)for(var b=0;b<d.length;b++)e[a+b]^=W(c[a],d[b]);return e},a.mod=function(e,d){for(var a=new Uint8Array(e);a.length-d.length>=0;){for(var f=a[0],b=0;b<d.length;b++)a[b]^=W(d[b],f);for(var c=0;c<a.length&&0===a[c];)c++;a=a.slice(c)}return a},a.generateECPolynomial=function(d){for(var e,b=new Uint8Array([1]),c=0;c<d;c++)b=a.mul(b,new Uint8Array([1,U[c]]));return b}});function o(a){this.genPoly=void 0,this.degree=a,this.degree&&this.initialize(this.degree)}n.mul,n.mod,n.generateECPolynomial,o.prototype.initialize=function(a){this.degree=a,this.genPoly=n.generateECPolynomial(this.degree)},o.prototype.encode=function(b){if(!this.genPoly)throw new Error("Encoder not initialized");var c=new Uint8Array(b.length+this.degree);c.set(b);var a=n.mod(c,this.genPoly),d=this.degree-a.length;if(d>0){var e=new Uint8Array(this.degree);return e.set(a,d),e}return a};var X=o,Y=function(a){return!isNaN(a)&&a>=1&&a<=40},k="(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+",A="(?:(?![A-Z0-9 $%*+\\-./:]|"+(k=k.replace(/u/g,"\\u"))+")(?:.|[\r\n]))+",B=new RegExp(k,"g"),C=new RegExp("[^A-Z0-9 $%*+\\-./:]+","g"),D=new RegExp(A,"g"),E=new RegExp("[A-Z $%*+\\-./:]+","g"),_=new RegExp("^"+k+"$"),Z=new RegExp("^[0-9]+$"),aa=new RegExp("^[A-Z0-9 $%*+\\-./:]+$"),ab={KANJI:B,BYTE_KANJI:C,BYTE:D,NUMERIC:/[0-9]+/g,ALPHANUMERIC:E,testKanji:function(a){return _.test(a)},testNumeric:function(a){return Z.test(a)},testAlphanumeric:function(a){return aa.test(a)}},c=a(function(b,a){a.NUMERIC={id:"Numeric",bit:1,ccBits:[10,12,14]},a.ALPHANUMERIC={id:"Alphanumeric",bit:2,ccBits:[9,11,13]},a.BYTE={id:"Byte",bit:4,ccBits:[8,16,16]},a.KANJI={id:"Kanji",bit:8,ccBits:[8,10,12]},a.MIXED={bit:-1},a.getCharCountIndicator=function(a,b){if(!a.ccBits)throw new Error("Invalid mode: "+a);if(!Y(b))throw new Error("Invalid version: "+b);return b>=1&&b<10?a.ccBits[0]:b<27?a.ccBits[1]:a.ccBits[2]},a.getBestModeForData=function(b){return ab.testNumeric(b)?a.NUMERIC:ab.testAlphanumeric(b)?a.ALPHANUMERIC:ab.testKanji(b)?a.KANJI:a.BYTE},a.toString=function(a){if(a&&a.id)return a.id;throw new Error("Invalid mode")},a.isValid=function(a){return a&&a.bit&&a.ccBits},a.from=function(b,c){if(a.isValid(b))return b;try{return function(b){if("string"!=typeof b)throw new Error("Param is not a string");switch(b.toLowerCase()){case"numeric":return a.NUMERIC;case"alphanumeric":return a.ALPHANUMERIC;case"kanji":return a.KANJI;case"byte":return a.BYTE;default:throw new Error("Unknown mode: "+b)}}(b)}catch(d){return c}}});c.NUMERIC,c.ALPHANUMERIC,c.BYTE,c.KANJI,c.MIXED,c.getCharCountIndicator,c.getBestModeForData,c.isValid;var p=a(function(b,a){var d=z(7973);function f(a,b){return c.getCharCountIndicator(a,b)+4}function g(a,c){var b=0;return a.forEach(function(a){var d=f(a.mode,c);b+=d+a.getBitsLength()}),b}a.from=function(a,b){return Y(a)?parseInt(a,10):b},a.getCapacity=function(b,g,a){if(!Y(b))throw new Error("Invalid QR Code version");void 0===a&&(a=c.BYTE);var e=8*(I(b)-T(b,g));if(a===c.MIXED)return e;var d=e-f(a,b);switch(a){case c.NUMERIC:return Math.floor(d/10*3);case c.ALPHANUMERIC:return Math.floor(d/11*2);case c.KANJI:return Math.floor(d/13);case c.BYTE:default:return Math.floor(d/8)}},a.getBestVersionForData=function(b,h){var d,f=e.from(h,e.M);if(Array.isArray(b)){if(b.length>1)return function(d,e){for(var b=1;b<=40;b++)if(g(d,b)<=a.getCapacity(b,e,c.MIXED))return b}(b,f);if(0===b.length)return 1;d=b[0]}else d=b;return function(c,d,e){for(var b=1;b<=40;b++)if(d<=a.getCapacity(b,e,c))return b}(d.mode,d.getLength(),f)},a.getEncodedBits=function(a){if(!Y(a)||a<7)throw new Error("Invalid QR Code version");for(var b=a<<12;z(b)-d>=0;)b^=7973<<z(b)-d;return a<<12|b}});p.getCapacity,p.getBestVersionForData,p.getEncodedBits;var ac=z(1335),ad=function(c,d){for(var b=c.bit<<3|d,a=b<<10;z(a)-ac>=0;)a^=1335<<z(a)-ac;return 21522^(b<<10|a)};function g(a){this.mode=c.NUMERIC,this.data=a.toString()}g.getBitsLength=function(a){return 10*Math.floor(a/3)+(a%3?a%3*3+1:0)},g.prototype.getLength=function(){return this.data.length},g.prototype.getBitsLength=function(){return g.getBitsLength(this.data.length)},g.prototype.write=function(a){for(b=0;b+3<=this.data.length;b+=3)c=parseInt(this.data.substr(b,3),10),a.put(c,10);var b,c,d=this.data.length-b;d>0&&(c=parseInt(this.data.substr(b),10),a.put(c,3*d+1))};var ae=g,$=["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"," ","$","%","*","+","-",".","/",":"];function h(a){this.mode=c.ALPHANUMERIC,this.data=a}h.getBitsLength=function(a){return 11*Math.floor(a/2)+a%2*6},h.prototype.getLength=function(){return this.data.length},h.prototype.getBitsLength=function(){return h.getBitsLength(this.data.length)},h.prototype.write=function(b){var a;for(a=0;a+2<=this.data.length;a+=2){var c=45*$.indexOf(this.data[a]);c+=$.indexOf(this.data[a+1]),b.put(c,11)}this.data.length%2&&b.put($.indexOf(this.data[a]),6)};var af=h;function i(a){this.mode=c.BYTE,"string"==typeof a&&(a=function(d){for(var b=[],f=d.length,c=0;c<f;c++){var a=d.charCodeAt(c);if(a>=55296&&a<=56319&&f>c+1){var e=d.charCodeAt(c+1);e>=56320&&e<=57343&&(a=1024*(a-55296)+e-56320+65536,c+=1)}a<128?b.push(a):a<2048?(b.push(a>>6|192),b.push(63&a|128)):a<55296||a>=57344&&a<65536?(b.push(a>>12|224),b.push(a>>6&63|128),b.push(63&a|128)):a>=65536&&a<=1114111?(b.push(a>>18|240),b.push(a>>12&63|128),b.push(a>>6&63|128),b.push(63&a|128)):b.push(239,191,189)}return new Uint8Array(b).buffer}(a)),this.data=new Uint8Array(a)}i.getBitsLength=function(a){return 8*a},i.prototype.getLength=function(){return this.data.length},i.prototype.getBitsLength=function(){return i.getBitsLength(this.data.length)},i.prototype.write=function(b){for(var a=0,c=this.data.length;a<c;a++)b.put(this.data[a],8)};var ag=i;function j(a){this.mode=c.KANJI,this.data=a}j.getBitsLength=function(a){return 13*a},j.prototype.getLength=function(){return this.data.length},j.prototype.getBitsLength=function(){return j.getBitsLength(this.data.length)},j.prototype.write=function(c){var b;for(b=0;b<this.data.length;b++){var a=L(this.data[b]);if(a>=33088&&a<=40956)a-=33088;else{if(!(a>=57408&&a<=60351))throw new Error("Invalid SJIS character: "+this.data[b]+"\nMake sure your charset is UTF-8");a-=49472}a=192*(a>>>8&255)+(255&a),c.put(a,13)}};var ah=j,ai=a(function(a){var b={single_source_shortest_paths:function(n,f,g){var j={},c={};c[f]=0;var k,h,a,l,i,d,m,e=b.PriorityQueue.make();for(e.push(f,0);!e.empty();)for(a in h=(k=e.pop()).value,l=k.cost,i=n[h]||{})i.hasOwnProperty(a)&&(d=l+i[a],m=c[a],(void 0===c[a]||m>d)&&(c[a]=d,e.push(a,d),j[a]=h));if(void 0!==g&& void 0===c[g]){var o=["Could not find a path from ",f," to ",g,"."].join("");throw new Error(o)}return j},extract_shortest_path_from_predecessor_list:function(c,d){for(var b=[],a=d;a;)b.push(a),a=c[a];return b.reverse(),b},find_path:function(c,d,a){var e=b.single_source_shortest_paths(c,d,a);return b.extract_shortest_path_from_predecessor_list(e,a)},PriorityQueue:{make:function(e){var a,c=b.PriorityQueue,d={};for(a in e=e||{},c)c.hasOwnProperty(a)&&(d[a]=c[a]);return d.queue=[],d.sorter=e.sorter||c.default_sorter,d},default_sorter:function(a,b){return a.cost-b.cost},push:function(a,b){this.queue.push({value:a,cost:b}),this.queue.sort(this.sorter)},pop:function(){return this.queue.shift()},empty:function(){return 0===this.queue.length}}};a.exports=b}),q=a(function(b,a){function d(a){return unescape(encodeURIComponent(a)).length}function e(c,d,e){for(var a,b=[];null!==(a=c.exec(e));)b.push({data:a[0],index:a.index,mode:d,length:a[0].length});return b}function f(a){var b,d,f=e(ab.NUMERIC,c.NUMERIC,a),g=e(ab.ALPHANUMERIC,c.ALPHANUMERIC,a);return K()?(b=e(ab.BYTE,c.BYTE,a),d=e(ab.KANJI,c.KANJI,a)):(b=e(ab.BYTE_KANJI,c.BYTE,a),d=[]),f.concat(g,b,d).sort(function(a,b){return a.index-b.index}).map(function(a){return{data:a.data,mode:a.mode,length:a.length}})}function g(a,b){switch(b){case c.NUMERIC:return ae.getBitsLength(a);case c.ALPHANUMERIC:return af.getBitsLength(a);case c.KANJI:return ah.getBitsLength(a);case c.BYTE:return ag.getBitsLength(a)}}function h(a,e){var b,d=c.getBestModeForData(a);if((b=c.from(e,d))!==c.BYTE&&b.bit<d.bit)throw new Error('"'+a+'" cannot be encoded with mode '+c.toString(b)+".\n Suggested mode is: "+c.toString(d));switch(b!==c.KANJI||K()||(b=c.BYTE),b){case c.NUMERIC:return new ae(a);case c.ALPHANUMERIC:return new af(a);case c.KANJI:return new ah(a);case c.BYTE:return new ag(a)}}a.fromArray=function(a){return a.reduce(function(b,a){return"string"==typeof a?b.push(h(a,null)):a.data&&b.push(h(a.data,a.mode)),b},[])},a.fromString=function(j,k){for(var l,e=function(m,p){for(var b={},e={start:{}},f=["start"],i=0;i<m.length;i++){for(var n=m[i],o=[],j=0;j<n.length;j++){var a=n[j],h=""+i+j;o.push(h),b[h]={node:a,lastCount:0},e[h]={};for(var k=0;k<f.length;k++){var d=f[k];b[d]&&b[d].node.mode===a.mode?(e[d][h]=g(b[d].lastCount+a.length,a.mode)-g(b[d].lastCount,a.mode),b[d].lastCount+=a.length):(b[d]&&(b[d].lastCount=a.length),e[d][h]=g(a.length,a.mode)+4+c.getCharCountIndicator(a.mode,p))}}f=o}for(var l=0;l<f.length;l++)e[f[l]].end=0;return{map:e,table:b}}(function(f){for(var b=[],e=0;e<f.length;e++){var a=f[e];switch(a.mode){case c.NUMERIC:b.push([a,{data:a.data,mode:c.ALPHANUMERIC,length:a.length},{data:a.data,mode:c.BYTE,length:a.length}]);break;case c.ALPHANUMERIC:b.push([a,{data:a.data,mode:c.BYTE,length:a.length}]);break;case c.KANJI:b.push([a,{data:a.data,mode:c.BYTE,length:d(a.data)}]);break;case c.BYTE:b.push([{data:a.data,mode:c.BYTE,length:d(a.data)}])}}return b}(f(j)),k),h=ai.find_path(e.map,"start","end"),i=[],b=1;b<h.length-1;b++)i.push(e.table[h[b]].node);return a.fromArray(i.reduce(function(a,b){var c=a.length-1>=0?a[a.length-1]:null;return c&&c.mode===b.mode?(a[a.length-1].data+=b.data,a):(a.push(b),a)},[]))},a.rawSplit=function(b){return a.fromArray(f(b))}});function aj(b,e,f){var a,c,d=b.size,g=ad(e,f);for(a=0;a<15;a++)c=1==(g>>a&1),a<6?b.set(a,8,c,!0):a<8?b.set(a+1,8,c,!0):b.set(d-15+a,8,c,!0),a<8?b.set(8,d-a-1,c,!0):a<9?b.set(8,15-a-1+1,c,!0):b.set(8,15-a-1,c,!0);b.set(d-8,8,1,!0)}q.fromArray,q.fromString,q.rawSplit;var F=function(d,a){if(void 0===d||""===d)throw new Error("No input text");var f,g,h=e.M;return void 0!==a&&(h=e.from(a.errorCorrectionLevel,e.M),f=p.from(a.version),g=b.from(a.maskPattern),a.toSJISFunc&&J(a.toSJISFunc)),function(f,a,e,g){if(Array.isArray(f))h=q.fromArray(f);else{if("string"!=typeof f)throw new Error("Invalid data");var h,j=a;if(!j){var k=q.rawSplit(f);j=p.getBestVersionForData(k,e)}h=q.fromString(f,j||40)}var i=p.getBestVersionForData(h,e);if(!i)throw new Error("The amount of data is too big to be stored in a QR Code");if(a){if(a<i)throw new Error("\nThe chosen QR Code version cannot contain this amount of data.\nMinimum version required to store current data is: "+i+".\n")}else a=i;var l=function(b,e,g){var a=new M;g.forEach(function(d){a.put(d.mode.bit,4),a.put(d.getLength(),c.getCharCountIndicator(d.mode,b)),d.write(a)});var f=8*(I(b)-T(b,e));for(a.getLengthInBits()+4<=f&&a.put(0,4);a.getLengthInBits()%8!=0;)a.putBit(0);for(var h=(f-a.getLengthInBits())/8,d=0;d<h;d++)a.put(d%2?17:236,8);return function(q,g,m){for(var e=I(g),r=T(g,m),a=S(g,m),s=a-e%a,h=Math.floor((e-r)/a),t=h+1,n=Math.floor(e/a)-h,u=new X(n),i=0,f=new Array(a),o=new Array(a),j=0,v=new Uint8Array(q.buffer),d=0;d<a;d++){var k=d<s?h:t;f[d]=v.slice(i,i+k),o[d]=u.encode(f[d]),i+=k,j=Math.max(j,k)}var b,c,l=new Uint8Array(e),p=0;for(b=0;b<j;b++)for(c=0;c<a;c++)b<f[c].length&&(l[p++]=f[c][b]);for(b=0;b<n;b++)for(c=0;c<a;c++)l[p++]=o[c][b];return l}(a,b,e)}(a,e,h),m=y(a),d=new N(m);return function(f,i){for(var h=f.size,g=P(i),c=0;c<g.length;c++)for(var d=g[c][0],e=g[c][1],a=-1;a<=7;a++)if(!(d+a<= -1||h<=d+a))for(var b=-1;b<=7;b++)e+b<= -1||h<=e+b||(a>=0&&a<=6&&(0===b||6===b)||b>=0&&b<=6&&(0===a||6===a)||a>=2&&a<=4&&b>=2&&b<=4?f.set(d+a,e+b,!0,!0):f.set(d+a,e+b,!1,!0))}(d,a),function(b){for(var d=b.size,a=8;a<d-8;a++){var c=a%2==0;b.set(a,6,c,!0),b.set(6,a,c,!0)}}(d),function(e,h){for(var d=t.getPositions(h),c=0;c<d.length;c++)for(var f=d[c][0],g=d[c][1],a=-2;a<=2;a++)for(var b=-2;b<=2;b++)-2===a||2===a|| -2===b||2===b||0===a&&0===b?e.set(f+a,g+b,!0,!0):e.set(f+a,g+b,!1,!0)}(d,a),aj(d,e,0),a>=7&&function(b,f){for(var c,d,e,g=b.size,h=p.getEncodedBits(f),a=0;a<18;a++)c=Math.floor(a/3),d=a%3+g-8-3,e=1==(h>>a&1),b.set(c,d,e,!0),b.set(d,c,e,!0)}(d,a),function(e,i){for(var f=e.size,c=-1,b=f-1,g=7,h=0,a=f-1;a>0;a-=2)for(6===a&&a--;;){for(var d=0;d<2;d++)if(!e.isReserved(b,a-d)){var j=!1;h<i.length&&(j=1==(i[h]>>>g&1)),e.set(b,a-d,j),-1== --g&&(h++,g=7)}if((b+=c)<0||f<=b){b-=c,c=-c;break}}}(d,l),isNaN(g)&&(g=b.getBestMask(d,aj.bind(null,d,e))),b.applyMask(g,d),aj(d,e,g),{modules:d,version:a,errorCorrectionLevel:e,maskPattern:g,segments:h}}(d,f,h,g)},l=a(function(b,a){function c(b){if("number"==typeof b&&(b=b.toString()),"string"!=typeof b)throw new Error("Color should be defined as hex string");var a=b.slice().replace("#","").split("");if(a.length<3||5===a.length||a.length>8)throw new Error("Invalid hex color: "+b);3!==a.length&&4!==a.length||(a=Array.prototype.concat.apply([],a.map(function(a){return[a,a]}))),6===a.length&&a.push("F","F");var c=parseInt(a.join(""),16);return{r:c>>24&255,g:c>>16&255,b:c>>8&255,a:255&c,hex:"#"+a.slice(0,6).join("")}}a.getOptions=function(a){a||(a={}),a.color||(a.color={});var d=void 0===a.margin||null===a.margin||a.margin<0?4:a.margin,b=a.width&&a.width>=21?a.width:void 0,e=a.scale||4;return{width:b,scale:b?4:e,margin:d,color:{dark:c(a.color.dark||"#000000ff"),light:c(a.color.light||"#ffffffff")},type:a.type,rendererOpts:a.rendererOpts||{}}},a.getScale=function(b,a){return a.width&&a.width>=b+2*a.margin?a.width/(b+2*a.margin):a.scale},a.getImageWidth=function(b,c){var d=a.getScale(b,c);return Math.floor((b+2*c.margin)*d)},a.qrToImageData=function(h,l,b){for(var k=l.modules.size,m=l.modules.data,i=a.getScale(k,b),f=Math.floor((k+2*b.margin)*i),c=b.margin*i,n=[b.color.light,b.color.dark],d=0;d<f;d++)for(var e=0;e<f;e++){var j=4*(d*f+e),g=b.color.light;d>=c&&e>=c&&d<f-c&&e<f-c&&(g=n[m[Math.floor((d-c)/i)*k+Math.floor((e-c)/i)]?1:0]),h[j++]=g.r,h[j++]=g.g,h[j++]=g.b,h[j]=g.a}}});l.getOptions,l.getScale,l.getImageWidth,l.qrToImageData;var m=a(function(b,a){a.render=function(h,b,k){var c=k,e=b;void 0!==c||b&&b.getContext||(c=b,b=void 0),b||(e=function(){try{return document.createElement("canvas")}catch(a){throw new Error("You need to specify a canvas element")}}()),c=l.getOptions(c);var i,a,d,f=l.getImageWidth(h.modules.size,c),g=e.getContext("2d"),j=g.createImageData(f,f);return l.qrToImageData(j.data,h,c),i=g,a=e,d=f,i.clearRect(0,0,a.width,a.height),a.style||(a.style={}),a.height=d,a.width=d,a.style.height=d+"px",a.style.width=d+"px",g.putImageData(j,0,0),e},a.renderToDataURL=function(d,c,e){var b=e;void 0!==b||c&&c.getContext||(b=c,c=void 0),b||(b={});var f=a.render(d,c,b),g=b.type||"image/png",h=b.rendererOpts||{};return f.toDataURL(g,h.quality)}});function ak(a,b){var c=a.a/255,d=b+'="'+a.hex+'"';return c<1?d+" "+b+'-opacity="'+c.toFixed(2).slice(1)+'"':d}function al(c,d,a){var b=c+d;return void 0!==a&&(b+=" "+a),b}m.render,m.renderToDataURL;var am=function(c,g,d){var a=l.getOptions(g),e=c.modules.size,h=c.modules.data,b=e+2*a.margin,i=a.color.light.a?"<path "+ak(a.color.light,"fill")+' d="M0 0h'+b+"v"+b+'H0z"/>':"",j="<path "+ak(a.color.dark,"stroke")+' d="'+function(b,e,i){for(var f="",g=0,c=!1,h=0,a=0;a<b.length;a++){var d=Math.floor(a%e),j=Math.floor(a/e);d||c||(c=!0),b[a]?(h++,a>0&&d>0&&b[a-1]||(f+=c?al("M",d+i,.5+j+i):al("m",g,0),g=0,c=!1),d+1<e&&b[a+1]||(f+=al("h",h),h=0)):g++}return f}(h,e,a.margin)+'"/>',f='<svg xmlns="http://www.w3.org/2000/svg" '+(a.width?'width="'+a.width+'" height="'+a.width+'" ':"")+('viewBox="0 0 '+b+" "+b+'"')+' shape-rendering="crispEdges">'+i+j+"</svg>\n";return"function"==typeof d&&d(null,f),f};function r(h,a,c,b,e){var f=[].slice.call(arguments,1),d=f.length,g="function"==typeof f[d-1];if(!g&&!("function"==typeof Promise&&Promise.prototype&&Promise.prototype.then))throw new Error("Callback required as last argument");if(!g){if(d<1)throw new Error("Too few arguments provided");return 1===d?(c=a,a=b=void 0):2!==d||a.getContext||(b=c,c=a,a=void 0),new Promise(function(d,e){try{var f=F(c,b);d(h(f,a,b))}catch(g){e(g)}})}if(d<2)throw new Error("Too few arguments provided");2===d?(e=c,c=a,a=b=void 0):3===d&&(a.getContext&& void 0===e?(e=b,b=void 0):(e=b,b=c,c=a,a=void 0));try{var i=F(c,b);e(null,h(i,a,b))}catch(j){e(j)}}var u=F,v=r.bind(null,m.render),w=r.bind(null,m.renderToDataURL),x=r.bind(null,function(a,c,b){return am(a,b)});return d.create=u,d.default={create:u,toCanvas:v,toDataURL:w,toString:x},d.toCanvas=v,d.toDataURL=w,d.toString=x,Object.defineProperty(d,"__esModule",{value:!0}),d})({})