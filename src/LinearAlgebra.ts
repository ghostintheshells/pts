// Source code licensed under Apache License 2.0. 
// Copyright © 2017 William Ngan. (https://github.com/williamngan)


import {Const, Util} from "./Util"
import {Pt, PtLike, GroupLike, Group} from "./Pt"
import {Line} from "./Op"


export class Vec {

  static add( a:PtLike, b:PtLike|number ):PtLike {
    if (typeof b == "number") {
      for (let i=0, len=a.length; i<len; i++) a[i] += b;
    } else {
      for (let i=0, len=a.length; i<len; i++) a[i] += b[i] || 0;
    }
    return a;
  }

  static subtract( a:PtLike, b:PtLike|number ):PtLike {
    if (typeof b == "number") {
      for (let i=0, len=a.length; i<len; i++) a[i] -= b;
    } else {
      for (let i=0, len=a.length; i<len; i++) a[i] -= b[i] || 0;
    }
    return a;
  }

  static multiply( a:PtLike, b:PtLike|number ):PtLike {
    if (typeof b == "number") {
      for (let i=0, len=a.length; i<len; i++) a[i] *= b;
    } else {
      if (a.length != b.length) {
        throw new Error(`Cannot do element-wise multiply since the array lengths don't match: ${a.toString()} multiply-with ${b.toString()}`);
      }
      for (let i=0, len=a.length; i<len; i++) a[i] *= b[i];
    }
    return a;
  }

  static divide( a:PtLike, b:PtLike|number ):PtLike {
    if (typeof b == "number") {
      if (b === 0) throw "Cannot divide by zero"
      for (let i=0, len=a.length; i<len; i++) a[i] /= b;
    } else {
      if (a.length != b.length) {
        throw new Error(`Cannot do element-wise divide since the array lengths don't match. ${a.toString()} divide-by ${b.toString()}`);
      }
      for (let i=0, len=a.length; i<len; i++) a[i] /= b[i];
    }
    return a;
  }

  static dot( a:PtLike, b:PtLike ):number {
    if (a.length != b.length) throw "Array lengths don't match"
    let d = 0;
    for (let i=0, len=a.length; i<len; i++) {
      d += a[i]*b[i];
    }
    return d;
  } 

  static cross( a:PtLike, b:PtLike ):Pt {
    return new Pt( (a[1]*b[2] - a[2]*b[1]), (a[2]*b[0] - a[0]*b[2]), (a[0]*b[1] - a[1]*b[0]) );
  }

  static magnitude( a:PtLike ):number {
    return Math.sqrt( Vec.dot( a, a ) );
  }

  static unit( a:PtLike, magnitude:number=undefined ):PtLike {
    let m = (magnitude===undefined) ? Vec.magnitude(a) : magnitude;
    return Vec.divide( a, m );
  }

  static abs( a:PtLike ):PtLike {
    return Vec.map( a, Math.abs );
  }

  static floor( a:PtLike ):PtLike {
    return Vec.map( a, Math.floor );
  }

  static ceil( a:PtLike ):PtLike {
    return Vec.map( a, Math.ceil );
  }

  static round( a:PtLike ):PtLike {
    return Vec.map( a, Math.round );
  }

  static max( a:PtLike ):{value, index} {
    let m = Number.MIN_VALUE;
    let index = 0;
    for (let i=0, len=a.length; i<len; i++) {
      m = Math.max( m, a[i] );
      if (m === a[i]) index = i;
    }
    return {value: m, index: index};
  }

  static min( a:PtLike ):{value, index} {
    let m = Number.MAX_VALUE;
    let index = 0;
    for (let i=0, len=a.length; i<len; i++) {
      m = Math.min( m, a[i] );
      if (m === a[i]) index = i;
    }
    return {value: m, index: index};
  }

  static sum( a:PtLike ):number {
    let s = 0;
    for (let i=0, len=a.length; i<len; i++) s += a[i];
    return s;
  }

  static map( a:PtLike, fn:(n:number, index:number, arr) => number ):PtLike {
    for (let i=0, len=a.length; i<len; i++) {
      a[i] = fn( a[i], i, a );
    }
    return a;
  }
  
}


export class Mat {

  /**
   * Matrix additions. Matrices should have the same rows and columns.
   * @param a a group of Pt
   * @param b a scalar number or a group of Pt
   * @returns a group with the same rows and columns as a and b
   */
  static add( a:GroupLike, b:GroupLike|number ):Group {
    if ( typeof b != "number" ) {
      if (a[0].length != b[0].length) throw "Cannot add matrix if rows' and columns' size don't match."
      if (a.length != b.length) throw "Cannot add matrix if rows' and columns' size don't match."
    }

    let g = new Group();
    let isNum = typeof b == "number"; 
    for (let i=0, len=a.length; i<len; i++) {
      g.push( a[i].$add( (isNum) ? b : b[i] ) );
    }

    return g;
  }


  /**
   * Matrix multiplication
   * @param a a Group of M Pts, each with K dimensions (M-rows, K-columns)
   * @param b a scalar number, or a Group of K Pts, each with N dimensions (K-rows, N-columns) -- or if transposed is true, then N Pts with K dimensions
   * @param transposed if true, then a and b's columns should match (ie, each Pt should have the same dimensions). 
   * @returns a group with M Pt, each with N dimensions (M-rows, N-columns)
   */
  static multiply( a:GroupLike, b:GroupLike|number, transposed:boolean=false ):Group {
    
    let g = new Group();

    if (typeof b != "number") {
      if (!transposed && a[0].length != b.length) throw "Cannot multiply matrix if rows in matrix-a don't match columns in matrix-b."
      if (transposed && a[0].length != b[0].length) throw "Cannot multiply matrix if transposed and the columns in both matrices don't match."

      if (!transposed) b = Mat.transpose( b );

      for (let ai = 0, alen = a.length; ai < alen; ai++) {
        let p = Pt.make( b.length, 0 );
        for (let bi = 0, blen = b.length; bi < blen; bi++) {
          p[bi] = a[ai].dot( b[bi] );
        }
        g.push(p);
      }

    } else {
      for (let ai = 0, alen = a.length; ai < alen; ai++) {
        g.push( a[ai].$multiply(b) );
      }
    }

    return g;
  }


  /**
   * Zip one slice of an array of Pt
   * @param g a group of Pt
   * @param idx index to zip at
   * @param defaultValue a default value to fill if index out of bound. If not provided, it will throw an error instead.
   */
  static zipSlice( g:GroupLike|number[][], index:number, defaultValue:number|boolean = false ):Pt {
    let f = (typeof defaultValue == "boolean") ? "get" : "at"; // choose `get` or `at` function
    let z = [];
    for (let i=0, len=g.length; i<len; i++) {
      if (g[i].length-1 < index && defaultValue === false) throw `Index ${index} is out of bounds`;
      z.push( g[i][index] || defaultValue );
    }
    return new Pt(z);
  }


  /**
   * Zip a group of Pt. eg, [[1,2],[3,4],[5,6]] => [[1,3,5],[2,4,6]]
   * @param g a group of Pt
   * @param defaultValue a default value to fill if index out of bound. If not provided, it will throw an error instead.
   * @param useLongest If true, find the longest list of values in a Pt and use its length for zipping. Default is false, which uses the first item's length for zipping.
   */
  static zip( g:GroupLike, defaultValue:number|boolean = false, useLongest=false ):Group {
    let ps = new Group();
    let len = (useLongest) ? g.reduce( (a,b) => Math.max(a, b.length), 0 ) : g[0].length;
    for (let i=0; i<len; i++) {
      ps.push( Mat.zipSlice( g, i, defaultValue ) )
    }
    return ps;
  }

  static transpose( g:GroupLike ) {
    return Mat.zip( g )
  }

  static transform2D( pt:PtLike, m:GroupLike|number[][] ):Pt {
    let x = pt[0] * m[0][0] + pt[1] * m[1][0] + m[2][0];
    let y = pt[0] * m[0][1] + pt[1] * m[1][1] + m[2][1];
    return new Pt(x, y);
  }

  static scale2DMatrix( x:number, y:number ):GroupLike {
    return new Group(
      new Pt( x, 0, 0 ),
      new Pt( 0, y, 0 ),
      new Pt( 0, 0, 1 )
    );
  }

  static rotate2DMatrix( cosA:number, sinA:number ):GroupLike {
    return new Group(
      new Pt( cosA, sinA, 0 ),
      new Pt( -sinA, cosA, 0, ),
      new Pt( 0, 0, 1 )
    );
  }

  static shear2DMatrix( tanX:number, tanY:number ):GroupLike {
    return new Group(
      new Pt( 1, tanX, 0 ),
      new Pt( tanY, 1, 0 ),
      new Pt( 0, 0, 1 )
    );
  }

  static translate2DMatrix( x:number, y:number ):GroupLike {
    return new Group(
      new Pt( 1, 0, 0 ),
      new Pt( 0, 1, 0 ),
      new Pt( x, y, 1 )
    );
  }

  static scaleAt2DMatrix( sx:number, sy:number, at:PtLike ):GroupLike {
    let m = Mat.scale2DMatrix(sx, sy);
    m[2][0] = -at[0]*sx + at[0];
    m[2][1] = -at[1]*sy + at[1];
    return m;
  }


  static rotateAt2DMatrix( cosA:number, sinA:number, at:PtLike ):GroupLike {
    let m = Mat.rotate2DMatrix(cosA, sinA);
    m[2][0] = at[0]*(1-cosA) + at[1]*sinA;
    m[2][1] = at[1]*(1-cosA) - at[0]*sinA;
    return m;
  }

  static shearAt2DMatrix( tanX:number, tanY:number, at:PtLike ):GroupLike {
    let m = Mat.shear2DMatrix(tanX, tanY);
    m[2][0] = -at[1]*tanY;
    m[2][1] = -at[0]*tanX;
    return m;
  }

  static reflectAt2DMatrix( p1:PtLike, p2:PtLike ) {
    let intercept = Line.intercept( p1, p2 );
    
    if (intercept == undefined) {
      return [
        new Pt( [-1, 0, 0] ),
        new Pt( [0, 1, 0] ),
        new Pt( [p1[0]+p2[0], 0, 1] )  
      ]
    } else {

      let yi = intercept.yi;
      let ang2 = Math.atan( intercept.slope ) * 2;
      let cosA = Math.cos( ang2 );
      let sinA = Math.sin( ang2 );
      
      return [
        new Pt( [cosA, sinA, 0] ),
        new Pt( [sinA, -cosA, 0] ),
        new Pt( [-yi*sinA, yi + yi*cosA, 1] )
      ]
    }
  }

  
}