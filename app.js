const els = {
  templateFile: document.getElementById("templateFile"),
  partsFile: document.getElementById("partsFile"),
  loadExample: document.getElementById("loadExample"),
  exportBtn: document.getElementById("exportBtn"),
  addPiece: document.getElementById("addPiece"),
  removeSelected: document.getElementById("removeSelected"),
  status: document.getElementById("status"),
  boardStatus: document.getElementById("boardStatus"),
  boardAncho: document.getElementById("boardAncho"),
  boardLargo: document.getElementById("boardLargo"),
  preview: document.getElementById("preview"),
  piecesTbody: document.querySelector("#piecesTable tbody"),
};

const MEASURE_SCALE = 10;
const FIXED_RECORD_COUNT = 501;
const FOOTER_RECORD_START = 489;
const FOOTER_LINES = [
  "26963,8302,27747,25961,29806,",
  "101,0,0,0,0,",
  "1234,0,32,0,180,",
  "16717,17748,18770,19521,17440,",
  "8261,21072,17749,16706,19488,",
  "21321,79,0,0,0,",
];
const LEGACY_TEMPLATE_TEXT = `RCP16-1.0

5,501
4,0,0,18332,1,
2,0,0,0,0,
0,18300,0,27300,1,
2,0,0,0,0,
1,10000,0,18300,1,
1,6000,0,18300,1,
1,1200,0,18300,1,
1,1200,0,18300,1,
1,4500,0,18300,1,
1,4500,0,4500,1,
1,5000,0,4500,1,
1,5000,0,4500,1,
1,3000,0,5000,1,
1,3000,0,5000,1,
1,18000,0,1200,1,
1,18000,0,1200,1,
1,9000,0,6000,1,
1,9000,0,6000,1,
1,10000,0,10000,1,
1,6000,0,10000,1,
1,9000,0,6000,1,
3,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
26963,8302,27747,25961,29806,
101,0,0,0,0,
1234,0,40,0,50,
16717,17748,18770,19521,17440,
8261,21072,17749,16706,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,`;

function createBaseTemplateText() {
  const header = ["RCP16-1.0", "", `5,${FIXED_RECORD_COUNT}`];
  const records = Array.from({ length: FIXED_RECORD_COUNT }, () => "0,0,0,0,0,");

  records[0] = "4,0,0,18332,1,";
  records[1] = "2,0,0,0,0,";
  records[2] = "0,18300,0,27300,1,";
  records[3] = "2,0,0,0,0,";
  records[4] = "3,0,0,0,0,";

  for (let i = 0; i < FOOTER_LINES.length; i += 1) {
    const recordIndex = FOOTER_RECORD_START - 1 + i;
    if (recordIndex >= 0 && recordIndex < records.length) records[recordIndex] = FOOTER_LINES[i];
  }

  return header.concat(records).join("\r\n");
}

const BASE_TEMPLATE_TEXT = createBaseTemplateText();

function normalizeLineEndings(text) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function formatMeasure(value) {
  if (!Number.isFinite(value)) return "";
  if (Number.isInteger(value)) return String(value);
  const s = value.toFixed(1);
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}

function parseRcpCsv(text) {
  const normalized = normalizeLineEndings(text);
  const lines = normalized.split("\n");
  const parsed = lines.map((raw, index) => {
    const fields = raw.length === 0 ? [] : raw.split(",").map((f) => f.trim());
    return { index, raw, fields, modified: false };
  });
  return parsed;
}

function isIntegerString(s) {
  return /^-?\d+$/.test(String(s ?? "").trim());
}

function isNumberString(s) {
  return /^-?\d+(?:[.,]\d+)?$/.test(String(s ?? "").trim());
}

function isPieceCandidateLine(line) {
  const f = line.fields;
  if (f.length < 5) return false;
  const op = f[0];
  const a = f[1];
  const mid = f[2];
  const b = f[3];
  const flag = f[4];
  if (!isIntegerString(op)) return false;
  if (!isNumberString(a) || !isNumberString(b)) return false;
  if (!isIntegerString(mid)) return false;
  if (!isIntegerString(flag)) return false;
  const opInt = Number.parseInt(op, 10);
  if (opInt <= 0) return false;
  const flagInt = Number.parseInt(flag, 10);
  if (flagInt !== 0 && flagInt !== 1) return false;
  if (Number.parseInt(mid, 10) !== 0) return false;
  const aVal = Number.parseFloat(String(a).replace(",", "."));
  const bVal = Number.parseFloat(String(b).replace(",", "."));
  if (!Number.isFinite(aVal) || !Number.isFinite(bVal)) return false;
  if (aVal <= 0 || bVal <= 0) return false;
  return true;
}

function detectPieceGroups(parsedLines) {
  const groups = [];
  let i = 0;
  while (i < parsedLines.length) {
    const line = parsedLines[i];
    if (!isPieceCandidateLine(line)) {
      i += 1;
      continue;
    }

    const f = line.fields;
    const opCode = Number.parseInt(f[0], 10);
    const aVal = Number.parseFloat(String(f[1]).replace(",", "."));
    const bVal = Number.parseFloat(String(f[3]).replace(",", "."));
    const veta = Number.parseInt(String(f[4]).trim(), 10) === 1 ? 1 : 0;
    const key = `${f[0]}|${f[1]}|${f[2]}|${f[3]}|${f[4]}|${f.length}`;

    let j = i + 1;
    while (j < parsedLines.length) {
      const next = parsedLines[j];
      if (!isPieceCandidateLine(next)) break;
      const nf = next.fields;
      const nKey = `${nf[0]}|${nf[1]}|${nf[2]}|${nf[3]}|${nf[4]}|${nf.length}`;
      if (nKey !== key) break;
      j += 1;
    }

    const lineIndices = [];
    for (let k = i; k < j; k += 1) lineIndices.push(k);
    groups.push({
      opCode,
      qty: lineIndices.length,
      largo: aVal / MEASURE_SCALE,
      ancho: bVal / MEASURE_SCALE,
      veta,
      lineIndices,
    });
    i = j;
  }
  return groups;
}

function serializeRcpCsv(parsedLines) {
  return parsedLines
    .map((l) => (l.modified ? l.fields.join(",") : l.raw))
    .join("\r\n")
    .replace(/\r\n$/, "");
}

function updatePieceGroupLines(parsedLines, group) {
  const scaledL = String(Math.round(group.largo * MEASURE_SCALE));
  const scaledA = String(Math.round(group.ancho * MEASURE_SCALE));
  const veta = group.veta === 0 ? "0" : "1";
  for (const lineIndex of group.lineIndices) {
    const line = parsedLines[lineIndex];
    const fields = line.fields.slice();
    fields[0] = String(group.opCode);
    fields[1] = scaledL;
    fields[2] = "0";
    fields[3] = scaledA;
    fields[4] = veta;
    if (fields.length < 6) fields[5] = "";
    line.fields = fields;
    line.raw = fields.join(",");
    line.modified = true;
  }
}

function buildPreview(text, maxLines = 60) {
  const lines = normalizeLineEndings(text).split("\n");
  const head = lines.slice(0, maxLines).join("\n");
  if (lines.length <= maxLines) return head;
  return `${head}\n...\n(${lines.length - maxLines} líneas más)`;
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function parsePartsCsv(text) {
  const normalized = normalizeLineEndings(text);
  const rows = normalized
    .split("\n")
    .map((r) => r.trim())
    .filter((r) => r.length > 0);

  const parts = [];
  for (const row of rows) {
    const cols = row.split(",").map((c) => c.trim());
    if (cols.length < 3) continue;
    const qty = Number.parseInt(cols[0], 10);
    const largo = Number.parseFloat(cols[1].replace(",", "."));
    const ancho = Number.parseFloat(cols[2].replace(",", "."));
    if (!Number.isFinite(qty) || !Number.isFinite(largo) || !Number.isFinite(ancho)) continue;
    if (qty <= 0 || largo <= 0 || ancho <= 0) continue;
    parts.push({ qty, largo, ancho });
  }
  return parts;
}

const DEFAULT_PIECE_OP_CODE = 1;

function reindexLines() {
  if (!state.parsedLines) return;
  state.parsedLines.forEach((l, idx) => (l.index = idx));
}

function rebuildPiecesFromLines() {
  if (!state.parsedLines) {
    state.pieces = [];
    return;
  }
  state.pieces = detectPieceGroups(state.parsedLines);
}

function setGroupQty(group, desiredQty) {
  if (!state.parsedLines) return;
  padOrTrimToFixedRecordCount();
  const nextQty = Math.max(1, Math.trunc(desiredQty));
  const currentQty = group.lineIndices.length;
  if (nextQty === currentQty) return;

  if (nextQty < currentQty) {
    const toRemove = group.lineIndices.slice(nextQty).sort((a, b) => b - a);
    for (const idx of toRemove) state.parsedLines.splice(idx, 1);
    reindexLines();
    padOrTrimToFixedRecordCount();
    rebuildPiecesFromLines();
    render();
    return;
  }

  const lastIdx = group.lineIndices[group.lineIndices.length - 1];
  const baseFields = state.parsedLines[lastIdx].fields.slice();
  const insertAt = lastIdx + 1;
  const need = nextQty - currentQty;
  const scaledL = String(Math.round(group.largo * MEASURE_SCALE));
  const scaledA = String(Math.round(group.ancho * MEASURE_SCALE));
  const veta = group.veta === 0 ? "0" : "1";

  if (!removePaddingToFit(need)) {
    setStatus("No hay espacio libre en los 501 registros (no quedan líneas 0,0,0,0,0, para reemplazar).");
    rebuildPiecesFromLines();
    render();
    return;
  }

  for (let i = 0; i < need; i += 1) {
    const fields = baseFields.slice();
    fields[0] = String(group.opCode);
    fields[1] = scaledL;
    fields[2] = "0";
    fields[3] = scaledA;
    fields[4] = veta;
    if (fields.length < 6) fields[5] = "";
    const raw = fields.join(",");
    state.parsedLines.splice(insertAt + i, 0, { index: 0, raw, fields, modified: true });
  }
  reindexLines();
  padOrTrimToFixedRecordCount();
  rebuildPiecesFromLines();
  render();
}

const state = {
  templateName: null,
  parsedLines: null,
  pieces: [],
  board: null,
  fixedRecordCount: 501,
  headerIndex: null,
  recordStart: null,
  recordEndExclusive: null,
};

function setStatus(html) {
  els.status.innerHTML = html;
}

function setBoardStatus(html) {
  els.boardStatus.innerHTML = html;
}

function setEnabled(enabled) {
  els.exportBtn.disabled = !enabled;
  els.removeSelected.disabled = !enabled;
  els.addPiece.disabled = false;
}

function setBoardEnabled(enabled) {
  els.boardAncho.disabled = !enabled;
  els.boardLargo.disabled = !enabled;
}

function updatePreviewOnly() {
  const exported = state.parsedLines ? serializeRcpCsv(getExportLinesFixed()) : "";
  els.preview.textContent = exported ? buildPreview(exported) : "";
}

function ensureTemplateLoaded() {
  if (state.parsedLines) return;
  loadTemplateFromText(BASE_TEMPLATE_TEXT, "plantilla_base.csv");
}

function refreshFixedRecordMeta() {
  if (!state.parsedLines) return;

  const headerIndex = state.parsedLines.findIndex((l) => {
    if (!l.fields?.length) return false;
    return String(l.fields[0]).trim() === "5" && isIntegerString(l.fields[1]);
  });

  state.headerIndex = headerIndex >= 0 ? headerIndex : null;
  if (state.headerIndex !== null) {
    state.fixedRecordCount = Math.max(1, Number.parseInt(state.parsedLines[state.headerIndex].fields[1], 10));
    state.recordStart = state.headerIndex + 1;
    state.recordEndExclusive = state.recordStart + state.fixedRecordCount;
  } else {
    state.fixedRecordCount = 501;
    state.recordStart = null;
    state.recordEndExclusive = null;
  }
}

function isPaddingLine(line) {
  const f = line.fields;
  if (!f || f.length < 5) return false;
  return (
    String(f[0]).trim() === "0" &&
    String(f[1]).trim() === "0" &&
    String(f[2]).trim() === "0" &&
    String(f[3]).trim() === "0" &&
    String(f[4]).trim() === "0"
  );
}

function createPaddingLine() {
  const fields = ["0", "0", "0", "0", "0", ""];
  const raw = fields.join(",");
  return { index: 0, raw, fields, modified: true };
}

function createLineFromRaw(raw) {
  const fields = raw.split(",").map((f) => f.trim());
  return { index: 0, raw, fields, modified: true };
}

function getFooterBaseIndex() {
  refreshFixedRecordMeta();
  if (state.recordStart === null) return null;
  return state.recordStart + (FOOTER_RECORD_START - 1);
}

function enforceFooterPositions() {
  if (!state.parsedLines) return;
  refreshFixedRecordMeta();
  if (state.recordStart === null || state.recordEndExclusive === null) return;

  const baseIndex = getFooterBaseIndex();
  if (baseIndex === null) return;
  for (let i = 0; i < FOOTER_LINES.length; i += 1) {
    const idx = baseIndex + i;
    if (idx < state.recordStart || idx >= state.recordEndExclusive) continue;
    state.parsedLines[idx] = createLineFromRaw(FOOTER_LINES[i]);
  }

  const footerFirstFields = new Set(
    FOOTER_LINES.map((l) => String(l.split(",")[0]).trim()).filter((v) => v.length > 0)
  );
  const footerEnd = baseIndex + FOOTER_LINES.length;
  for (let i = footerEnd; i < state.recordEndExclusive; i += 1) {
    const f0 = String(state.parsedLines[i]?.fields?.[0] ?? "").trim();
    if (!footerFirstFields.has(f0)) continue;
    state.parsedLines[i] = createPaddingLine();
  }
}

function padOrTrimToFixedRecordCount() {
  if (!state.parsedLines) return;
  refreshFixedRecordMeta();
  if (state.recordEndExclusive === null || state.recordStart === null) return;

  while (state.parsedLines.length < state.recordEndExclusive) {
    state.parsedLines.push(createPaddingLine());
  }

  if (state.parsedLines.length > state.recordEndExclusive) {
    state.parsedLines = state.parsedLines.slice(0, state.recordEndExclusive);
  }

  enforceFooterPositions();

  reindexLines();
}

function removePaddingToFit(extraLinesNeeded) {
  if (!state.parsedLines) return true;
  refreshFixedRecordMeta();
  if (state.recordStart === null || state.recordEndExclusive === null) return true;

  const footerBaseIndex = getFooterBaseIndex();
  if (footerBaseIndex === null) return false;

  let op3Index = -1;
  for (let i = state.recordStart; i < footerBaseIndex; i += 1) {
    if (isOp3MarkerLine(state.parsedLines[i])) {
      op3Index = i;
      break;
    }
  }
  if (op3Index === -1) op3Index = footerBaseIndex - 1;

  for (let n = 0; n < extraLinesNeeded; n += 1) {
    let removed = false;
    for (let i = footerBaseIndex - 1; i > op3Index; i -= 1) {
      if (!isPaddingLine(state.parsedLines[i])) continue;
      state.parsedLines.splice(i, 1);
      removed = true;
      break;
    }
    if (!removed) return false;
  }
  reindexLines();
  return true;
}

function getExportLinesFixed() {
  if (!state.parsedLines) return [];
  padOrTrimToFixedRecordCount();
  refreshFixedRecordMeta();
  if (state.recordEndExclusive === null) return state.parsedLines;
  return state.parsedLines.slice(0, state.recordEndExclusive);
}

function isBoardLine(line) {
  const f = line.fields;
  if (f.length < 5) return false;
  if (String(f[0]).trim() !== "0") return false;
  if (!isNumberString(f[1]) || !isNumberString(f[3])) return false;
  if (String(f[2]).trim() !== "0") return false;
  if (String(f[4]).trim() !== "1") return false;
  const aVal = Number.parseFloat(String(f[1]).replace(",", "."));
  const bVal = Number.parseFloat(String(f[3]).replace(",", "."));
  if (!Number.isFinite(aVal) || !Number.isFinite(bVal)) return false;
  if (aVal <= 0 || bVal <= 0) return false;
  return true;
}

function isOp2MarkerLine(line) {
  const f = line.fields;
  if (f.length < 5) return false;
  if (String(f[0]).trim() !== "2") return false;
  return (
    String(f[1]).trim() === "0" &&
    String(f[2]).trim() === "0" &&
    String(f[3]).trim() === "0" &&
    String(f[4]).trim() === "0"
  );
}

function isOp3MarkerLine(line) {
  const f = line.fields;
  if (f.length < 5) return false;
  if (String(f[0]).trim() !== "3") return false;
  return (
    String(f[1]).trim() === "0" &&
    String(f[2]).trim() === "0" &&
    String(f[3]).trim() === "0" &&
    String(f[4]).trim() === "0"
  );
}

function detectBoard(parsedLines) {
  for (const line of parsedLines) {
    if (!isBoardLine(line)) continue;
    const aVal = Number.parseFloat(String(line.fields[1]).replace(",", "."));
    const bVal = Number.parseFloat(String(line.fields[3]).replace(",", "."));
    return {
      lineIndex: line.index,
      ancho: aVal / MEASURE_SCALE,
      largo: bVal / MEASURE_SCALE,
    };
  }
  return null;
}

function normalizeTemplateStructure() {
  if (!state.parsedLines) return;

  const board = detectBoard(state.parsedLines);
  if (board) {
    const afterBoard = state.parsedLines[board.lineIndex + 1];
    if (!afterBoard || !isOp2MarkerLine(afterBoard)) {
      const fields = ["2", "0", "0", "0", "0", ""];
      const raw = fields.join(",");
      state.parsedLines.splice(board.lineIndex + 1, 0, { index: 0, raw, fields, modified: true });
      reindexLines();
    }
  }

  const hasOp3 = state.parsedLines.some((l) => isOp3MarkerLine(l));
  if (!hasOp3) {
    const fields = ["3", "0", "0", "0", "0", ""];
    const raw = fields.join(",");
    state.parsedLines.push({ index: 0, raw, fields, modified: true });
    reindexLines();
  }
}

function updateBoardLine(parsedLines, board) {
  const line = parsedLines[board.lineIndex];
  const fields = line.fields.slice();
  fields[0] = "0";
  fields[1] = String(Math.round(board.ancho * MEASURE_SCALE));
  fields[2] = "0";
  fields[3] = String(Math.round(board.largo * MEASURE_SCALE));
  fields[4] = "1";
  if (fields.length < 6) fields[5] = "";
  line.fields = fields;
  line.raw = fields.join(",");
  line.modified = true;
}

function renderBoard() {
  if (!state.parsedLines || !state.board) {
    setBoardEnabled(false);
    els.boardAncho.value = "";
    els.boardLargo.value = "";
    setBoardStatus("Cargá una plantilla para editar la placa.");
    return;
  }
  setBoardEnabled(true);
  els.boardAncho.value = formatMeasure(state.board.ancho);
  els.boardLargo.value = formatMeasure(state.board.largo);
  setBoardStatus(`Editando línea <strong>${state.board.lineIndex + 1}</strong> de la placa.`);
}

function render() {
  renderBoard();
  els.piecesTbody.innerHTML = "";
  state.pieces.forEach((piece, pieceIndex) => {
    const tr = document.createElement("tr");
    tr.dataset.pieceIndex = String(pieceIndex);

    const tdSel = document.createElement("td");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "rowSelect";
    tdSel.appendChild(cb);

    const tdQty = document.createElement("td");
    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.min = "1";
    qtyInput.step = "1";
    qtyInput.value = String(piece.qty);
    qtyInput.className = "cellInput";
    let qtyTimer = null;
    const applyQty = () => {
      const next = Number.parseInt(qtyInput.value, 10);
      if (Number.isFinite(next) && next > 0) setGroupQty(piece, next);
    };
    qtyInput.addEventListener("input", () => {
      if (qtyTimer) window.clearTimeout(qtyTimer);
      qtyTimer = window.setTimeout(applyQty, 450);
    });
    qtyInput.addEventListener("blur", applyQty);
    tdQty.appendChild(qtyInput);

    const tdL = document.createElement("td");
    const lInput = document.createElement("input");
    lInput.type = "number";
    lInput.min = "0.1";
    lInput.step = "0.1";
    lInput.value = formatMeasure(piece.largo);
    lInput.className = "cellInput";
    lInput.addEventListener("input", () => {
      const next = Number.parseFloat(lInput.value);
      if (Number.isFinite(next) && next > 0) piece.largo = next;
      updatePieceGroupLines(state.parsedLines, piece);
      updatePreviewOnly();
    });
    tdL.appendChild(lInput);

    const tdA = document.createElement("td");
    const aInput = document.createElement("input");
    aInput.type = "number";
    aInput.min = "0.1";
    aInput.step = "0.1";
    aInput.value = formatMeasure(piece.ancho);
    aInput.className = "cellInput";
    aInput.addEventListener("input", () => {
      const next = Number.parseFloat(aInput.value);
      if (Number.isFinite(next) && next > 0) piece.ancho = next;
      updatePieceGroupLines(state.parsedLines, piece);
      updatePreviewOnly();
    });
    tdA.appendChild(aInput);

    const tdTipo = document.createElement("td");
    const vetaSelect = document.createElement("select");
    vetaSelect.className = "cellInput";
    const opt1 = document.createElement("option");
    opt1.value = "1";
    opt1.textContent = "1";
    const opt0 = document.createElement("option");
    opt0.value = "0";
    opt0.textContent = "0";
    vetaSelect.appendChild(opt1);
    vetaSelect.appendChild(opt0);
    vetaSelect.value = piece.veta === 0 ? "0" : "1";
    vetaSelect.addEventListener("change", () => {
      piece.veta = Number.parseInt(vetaSelect.value, 10) === 1 ? 1 : 0;
      updatePieceGroupLines(state.parsedLines, piece);
      updatePreviewOnly();
    });
    tdTipo.appendChild(vetaSelect);

    const tdLine = document.createElement("td");
    tdLine.className = "mono";
    const firstLine = piece.lineIndices[0] ?? 0;
    const lastLine = piece.lineIndices[piece.lineIndices.length - 1] ?? firstLine;
    tdLine.textContent =
      firstLine === lastLine ? String(firstLine + 1) : `${firstLine + 1}-${lastLine + 1}`;

    tr.appendChild(tdSel);
    tr.appendChild(tdQty);
    tr.appendChild(tdL);
    tr.appendChild(tdA);
    tr.appendChild(tdTipo);
    tr.appendChild(tdLine);
    els.piecesTbody.appendChild(tr);
  });

  const exported = state.parsedLines ? serializeRcpCsv(getExportLinesFixed()) : "";
  els.preview.textContent = exported ? buildPreview(exported) : "";
}

function loadTemplateFromText(text, name) {
  state.templateName = name ?? "rcp16.csv";
  state.parsedLines = parseRcpCsv(text);
  state.board = detectBoard(state.parsedLines);
  normalizeTemplateStructure();
  padOrTrimToFixedRecordCount();
  state.board = detectBoard(state.parsedLines);
  rebuildPiecesFromLines();
  setEnabled(true);
  if (!state.board) setBoardStatus("No se detectó la línea de placa (0, ..., 1,).");
  setStatus(
    `<strong>${state.templateName}</strong> cargado. Piezas detectadas: <strong>${state.pieces.length}</strong>.`
  );
  render();
}

function getInsertIndexForNewPiece() {
  if (!state.parsedLines) return 0;
  if (state.pieces.length === 0) {
    const op3Index = state.parsedLines.findIndex((l) => isOp3MarkerLine(l));
    if (op3Index >= 0) return op3Index;
    return Math.max(0, state.parsedLines.length);
  }
  const maxLine = Math.max(...state.pieces.map((p) => p.lineIndices[p.lineIndices.length - 1] ?? 0));
  return maxLine + 1;
}

function addNewPiece() {
  ensureTemplateLoaded();
  padOrTrimToFixedRecordCount();
  if (!removePaddingToFit(1)) {
    setStatus("No hay espacio libre en los 501 registros para agregar otra pieza.");
    return;
  }
  const insertAt = getInsertIndexForNewPiece();
  const raw = `${DEFAULT_PIECE_OP_CODE},10000,0,10000,1,`;
  const line = { index: insertAt, raw, fields: raw.split(",").map((f) => f.trim()), modified: true };
  state.parsedLines.splice(insertAt, 0, line);
  reindexLines();
  padOrTrimToFixedRecordCount();
  rebuildPiecesFromLines();
  render();
}

function removeSelectedPieces() {
  if (!state.parsedLines) return;
  const selected = Array.from(document.querySelectorAll(".rowSelect"))
    .filter((cb) => cb.checked)
    .map((cb) => Number.parseInt(cb.closest("tr").dataset.pieceIndex, 10))
    .filter((n) => Number.isFinite(n));
  if (selected.length === 0) return;

  const indicesToRemove = new Set();
  for (const pieceIndex of selected) {
    const p = state.pieces[pieceIndex];
    if (!p) continue;
    for (const idx of p.lineIndices) indicesToRemove.add(idx);
  }
  const ordered = Array.from(indicesToRemove).sort((a, b) => b - a);
  for (const idx of ordered) state.parsedLines.splice(idx, 1);
  reindexLines();
  padOrTrimToFixedRecordCount();
  rebuildPiecesFromLines();
  render();
}

async function readFileAsText(file) {
  return await file.text();
}

async function onTemplateSelected() {
  const file = els.templateFile.files?.[0];
  if (!file) return;
  const text = await readFileAsText(file);
  loadTemplateFromText(text, file.name);
}

async function onPartsSelected() {
  const file = els.partsFile.files?.[0];
  if (!file) return;
  if (!state.parsedLines) {
    setStatus("Primero cargá una plantilla CSV del proveedor.");
    els.partsFile.value = "";
    return;
  }
  padOrTrimToFixedRecordCount();
  const text = await readFileAsText(file);
  const parts = parsePartsCsv(text);
  if (parts.length === 0) {
    setStatus("No se detectaron piezas válidas en el CSV de piezas.");
    els.partsFile.value = "";
    return;
  }

  const pieceLineIndices = [];
  for (let i = 0; i < state.parsedLines.length; i += 1) {
    if (isPieceCandidateLine(state.parsedLines[i])) pieceLineIndices.push(i);
  }
  const indicesToRemove = new Set(pieceLineIndices);
  const kept = state.parsedLines.filter((_, idx) => !indicesToRemove.has(idx));
  const insertAt = pieceLineIndices.length ? Math.min(...pieceLineIndices) : kept.length;

  const newLines = [];
  for (const part of parts) {
    const scaledL = Math.round(part.largo * MEASURE_SCALE);
    const scaledA = Math.round(part.ancho * MEASURE_SCALE);
    for (let i = 0; i < part.qty; i += 1) {
      const raw = `${DEFAULT_PIECE_OP_CODE},${scaledL},0,${scaledA},1,`;
      newLines.push({ index: 0, raw, fields: raw.split(",").map((f) => f.trim()), modified: true });
    }
  }

  kept.splice(insertAt, 0, ...newLines);
  refreshFixedRecordMeta();
  if (state.recordEndExclusive !== null && kept.length > state.recordEndExclusive) {
    setStatus("La lista de piezas excede los 501 registros disponibles.");
    els.partsFile.value = "";
    return;
  }
  state.parsedLines = kept;
  reindexLines();
  padOrTrimToFixedRecordCount();
  rebuildPiecesFromLines();
  setStatus(
    `Se importaron <strong>${parts.length}</strong> piezas desde <strong>${file.name}</strong>.`
  );
  render();
  els.partsFile.value = "";
}

function exportNow() {
  if (!state.parsedLines) return;
  const text = serializeRcpCsv(getExportLinesFixed());
  const base = state.templateName ? state.templateName.replace(/\.csv$/i, "") : "rcp16";
  downloadText(`${base}_export.csv`, text);
}

async function loadExample() {
  try {
    const res = await fetch("./ejemplo_proveedor_completo.csv", { cache: "no-store" });
    if (!res.ok) throw new Error("fetch_failed");
    const text = await res.text();
    loadTemplateFromText(text, "ejemplo_proveedor_completo.csv");
  } catch {
    loadTemplateFromText(BASE_TEMPLATE_TEXT, "plantilla_base.csv");
    setStatus("<strong>Plantilla base</strong> cargada (fallback).");
  }
}

els.templateFile.addEventListener("change", onTemplateSelected);
els.partsFile.addEventListener("change", onPartsSelected);
els.loadExample.addEventListener("click", loadExample);
els.exportBtn.addEventListener("click", exportNow);
els.addPiece.addEventListener("click", addNewPiece);
els.removeSelected.addEventListener("click", removeSelectedPieces);
els.boardAncho.addEventListener("input", () => {
  if (!state.parsedLines || !state.board) return;
  const next = Number.parseFloat(els.boardAncho.value);
  if (!Number.isFinite(next) || next <= 0) return;
  state.board.ancho = next;
  updateBoardLine(state.parsedLines, state.board);
  updatePreviewOnly();
});
els.boardLargo.addEventListener("input", () => {
  if (!state.parsedLines || !state.board) return;
  const next = Number.parseFloat(els.boardLargo.value);
  if (!Number.isFinite(next) || next <= 0) return;
  state.board.largo = next;
  updateBoardLine(state.parsedLines, state.board);
  updatePreviewOnly();
});

setEnabled(false);
setStatus("Cargá una plantilla CSV del proveedor para empezar.");
setBoardEnabled(false);
setBoardStatus("Cargá una plantilla para editar la placa.");
