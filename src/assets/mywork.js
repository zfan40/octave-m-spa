// one more chance, one more time
 ['783', '880', '932', '987', '1046', '1108', '1108', '1174', '1174', '1174', '1318', '1318', '1396', '1396', '1567', '1567', '1760', '1760'];

 // 底下低音,上面高音
 const DOT_WIDTH = 0.6;
 const RATIO = 0.82;
 const OFFSET = 2.2; // 1.95 is center
 const OUTER_RADIUS = 6.6;
 const INNER_RADIUS = 5.9;
 function generatePin(noteSec, noteNo) {
   return rotate(90, [1, 0, 4 * noteSec * RATIO / 15], cylinder({
     h: 1,
     r: DOT_WIDTH / 2,
     center: true,
   })).translate([sin(360 * noteSec * RATIO / 15) * OUTER_RADIUS, -cos(360 * noteSec * RATIO / 15) * OUTER_RADIUS, -9.95 + OFFSET + 0.4 + (noteNo - 1) * 0.9]);
 }

 function main() {
   const cylinderBody = difference(cylinder({ h: 19.9, r: OUTER_RADIUS, center: true }), cylinder({ h: 19.9, r: INNER_RADIUS, center: true }));
   const holes = union(generatePin(4.5115, 1), generatePin(17.075, 1), generatePin(7.6179, 2), generatePin(5.1327, 3), generatePin(2.6148, 4), generatePin(0, 5), generatePin(3.883, 5), generatePin(14.6369, 5), generatePin(8.2417, 6), generatePin(8.8673, 7), generatePin(12.3272, 7), generatePin(9.2, 8), generatePin(9.7667, 9), generatePin(9.9949, 10), generatePin(15.2991, 10), generatePin(15.9153, 9), generatePin(1.6573, 11), generatePin(3.2568, 11), generatePin(6.7773, 11), generatePin(7.357, 12), generatePin(9.4835, 12), generatePin(11.9293, 12), generatePin(14.2129, 12), generatePin(16.2123, 12), generatePin(18.079, 12), generatePin(1.2921, 13), generatePin(2.2813, 14), generatePin(6.4404, 14), generatePin(10.6589, 14), generatePin(11.5811, 13), generatePin(12.1965, 14), generatePin(12.969, 13), generatePin(13.8957, 14), generatePin(14.4788, 13), generatePin(16.5955, 13), generatePin(0.6808, 15), generatePin(5.7904, 15), generatePin(11.2464, 15), generatePin(13.6123, 15), generatePin(17.446, 15), generatePin(18.472, 15), generatePin(19.3289, 16), generatePin(17.2094, 17), generatePin(19.0477, 17));
   return union(cylinderBody, holes).translate([0, 0, 0]).scale(1);
 }

 ['783', '880', '932', '987', '1046', '1108', '1108', '1174', '1174', '1174', '1318', '1318', '1396', '1396', '1396', '1567', '1567', '1760'];

    // 底下低音,上面高音
 const DOT_WIDTH = 0.6;
 const RATIO = 0.82;
 const OFFSET = 2.2; // 1.95 is center
 const OUTER_RADIUS = 6.6;
 const INNER_RADIUS = 5.9;
 function generatePin(noteSec, noteNo) {
   return rotate(90, [1, 0, 4 * noteSec * RATIO / 15], cylinder({
     h: 1,
     r: DOT_WIDTH / 2,
     center: true,
   })).translate([sin(360 * noteSec * RATIO / 15) * OUTER_RADIUS, -cos(360 * noteSec * RATIO / 15) * OUTER_RADIUS, -9.95 + OFFSET + 0.4 + (noteNo - 1) * 0.9]);
 }

 function main() {
   const cylinderBody = difference(cylinder({ h: 19.9, r: OUTER_RADIUS, center: true }), cylinder({ h: 19.9, r: INNER_RADIUS, center: true }));
   const holes = union(generatePin(3.8664, 1), generatePin(15.2895, 1), generatePin(6.5225, 2), generatePin(4.3334, 3), generatePin(2.1539, 4), generatePin(0, 5), generatePin(3.2826, 5), generatePin(13.0672, 5), generatePin(7.079, 6), generatePin(7.6351, 7), generatePin(10.8295, 7), generatePin(7.8976, 8), generatePin(8.4139, 9), generatePin(8.7378, 10), generatePin(13.3388, 10), generatePin(13.9061, 9), generatePin(14.2075, 8), generatePin(1.4472, 11), generatePin(2.7012, 11), generatePin(5.7461, 11), generatePin(6.2745, 12), generatePin(8.1629, 12), generatePin(10.531, 12), generatePin(12.4803, 12), generatePin(14.5635, 12), generatePin(16.2417, 12), generatePin(1.1307, 13), generatePin(1.9861, 14), generatePin(5.4627, 14), generatePin(9.0843, 14), generatePin(9.6505, 13), generatePin(10.2302, 14), generatePin(10.7473, 13), generatePin(11.2395, 14), generatePin(11.7328, 15), generatePin(12.2648, 14), generatePin(12.7315, 13), generatePin(14.9137, 13), generatePin(0.625, 16), generatePin(4.9332, 16), generatePin(9.9803, 16), generatePin(12.0129, 16), generatePin(15.6801, 16), generatePin(16.6115, 17), generatePin(17.4477, 16), generatePin(15.3898, 18), generatePin(17.1807, 18));
   return union(cylinderBody, holes).translate([0, 0, 0]).scale(1);
 }
