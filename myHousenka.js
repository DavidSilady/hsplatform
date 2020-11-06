// // Housenka (Nibbles Revival)
// // implementoval na Vanoce 2007 Milan Sorm
//
//
//
// function deleteOriginalTable() {
//     const tables = document.getElementsByTagName("TABLE");
//     for (let i = tables.length - 1; i >= 0; i -= 1)
//         if (tables[i])
//             tables[i].parentNode.removeChild(tables[i]);
// }
//
// function housenkaInit () {
//     //deleteOriginalTable();
//    /* if (DEBUG) console.log("Building Canvas");
//     document.write('<style>canvas {border: solid 3px red}</style>')
//     document.write('<canvas id="myCanvas" width="'+(xsize * TILE_SIZE)+'" height="'+(ysize * TILE_SIZE)+'"> </canvas>');
//     if (DEBUG) console.log("Canvas Built");
//     const canvas = document.getElementById("myCanvas");
//     CONTEXT = canvas.getContext("2d");
//     IMAGES = loadImages();
//     drawBorders();*/
//     novaHra();
//     window.onload = function () { startHry(); }
//     document.defaultAction = false;
// }
//
// function stiskKlavesy (e) {
//     //right down left up
//     nastav_smer = [[39, 76, 68], [40, 75, 83], [37, 74, 65], [38, 73, 87]]; // added new keys
//
//     const udalost = e || window["event"];
//
//     klavesy[udalost["keyCode"]] = true;
//
//     if (startuj_hru) {
//         rozpohybujHousenku();
//         startuj_hru = 0;
//         show_result(hlaska);
//     }
//
//     let obslouzena = false;
//     for (let key_group_index in nastav_smer) {
//         nastav_smer[key_group_index].forEach(key => {
//             if (key === udalost["keyCode"]) {
//                 if (DEBUG) console.log(key_group_index + ' ' + nastav_smer[key_group_index]);
//                 if (smer % 2 !== key_group_index % 2 && povolena_zmena_smeru) {
//                     smer = key_group_index;
//                     povolena_zmena_smeru = 0;
//                 }
//             obslouzena = true;
//         }})
//     }
//
//     if (udalost["keyCode"] === 27) {  // esc
//         obslouzena = true;
//         zastavHru('user');
//     } else if (udalost["keyCode"] === 80) { // P
//         obslouzena = true;
//         zastavHousenku();
//         startuj_hru = 1;
//     }
//
//     return !obslouzena;
// }
// //TODO
// function vymazPlochu () {
//     let i;
//     for (i in plocha) nastavBarvu(i,0);
//     if (DEBUG) console.log("Clearing Canvas");
//     CONTEXT.clearRect(TILE_SIZE, TILE_SIZE, (xsize - 1) * TILE_SIZE, (ysize - 1) * TILE_SIZE);
// }
//
// //TODO
// //const obsahy = ['prazdne', 'telicko', 'zradlo', 'zed', 'klic', 'dvere', 'hlavicka'];
// function nastavBarvu (index, color) {
//     plocha[index] = color;
//     const coordinates = coordinateHash[index];
//     document.getElementById('pole-'+index).className = obsahy[color];
//     if (DEBUG) console.log("Writing Image " + obsahy[color] + " at " + coordinates.x + " " + coordinates.y);
//     if (color === 0) {
//         CONTEXT.clearRect(coordinates.x * TILE_SIZE, coordinates.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
//         //CONTEXT.drawImage(IMAGES.borderImg, TILE_SIZE * coordinates.x, TILE_SIZE * coordinates.y, TILE_SIZE, TILE_SIZE);
//     } else if (color === 1) {
//         CONTEXT.drawImage(IMAGES.bodyImg, TILE_SIZE * coordinates.x, TILE_SIZE * coordinates.y, TILE_SIZE, TILE_SIZE);
//     } else if (color === 2) {
//         CONTEXT.drawImage(IMAGES.foodImg, TILE_SIZE * coordinates.x, TILE_SIZE * coordinates.y, TILE_SIZE, TILE_SIZE);
//     } else if (color === 3) {
//         CONTEXT.drawImage(IMAGES.borderImg, TILE_SIZE * coordinates.x, TILE_SIZE * coordinates.y, TILE_SIZE, TILE_SIZE);
//     } else if (color === 4) {
//         CONTEXT.drawImage(IMAGES.keyImg, TILE_SIZE * coordinates.x, TILE_SIZE * coordinates.y, TILE_SIZE, TILE_SIZE);
//     } else if (color === 5) {
//         CONTEXT.drawImage(IMAGES.doorImg, TILE_SIZE * coordinates.x, TILE_SIZE * coordinates.y, TILE_SIZE, TILE_SIZE);
//     } else if (color === 6) {
//         CONTEXT.drawImage(IMAGES.headImg, TILE_SIZE * coordinates.x, TILE_SIZE * coordinates.y, TILE_SIZE, TILE_SIZE);
//     }
// }
