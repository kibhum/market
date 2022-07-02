const Pdfmake = require("pdfmake");
const bwipjs = require("bwip-js");
const sharp = require("sharp");
const converter = require("number-to-words");
// const User = require("../models/user");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.printAllItems = catchAsync(async (req, res, next) => {
  let itemsArr = [];
  req.itemsPrint.forEach((item) => {
    const itemsPrint = [
      { text: `${item.id}`, alignment: "center" },
      { text: `${item.batchNumber}`, alignment: "center" },
      { text: `${item.barcode}`, alignment: "center" },
      {
        text: `${new Date(item.dateCreated).toLocaleString()}`,
        alignment: "center",
      },
    ];
    itemsArr.push(itemsPrint);
  });

  console.log(itemsArr);
  // Fonts
  const fonts = {
    Roboto: {
      normal: "fonts/roboto/Roboto-Regular.ttf",
      bold: "fonts/roboto/Roboto-Medium.ttf",
      italics: "fonts/roboto/Roboto-Italic.ttf",
      bolditalics: "fonts/roboto/Roboto-MediumItalic.ttf",
    },
  };

  let pdfmake = new Pdfmake(fonts);

  let content = [
    {
      canvas: [
        {
          type: "line",
          x1: 0,
          y1: 0,
          x2: 515,
          y2: 0,
          lineWidth: 1,
          color: "grey",
        },
      ],
    },
    {
      margin: [10, 10, 10, 5],
      fontSize: 15,
      text: `All Items`,
      alignment: "center",
    },

    {
      table: {
        headerRows: 1,
        heights: 50,
        alignment: "center",
        widths: [100, 130, 130, 130, 130],
        body: [
          [
            { text: "Id", alignment: "center", bold: true },
            { text: "Batch Number", alignment: "center", bold: true },
            { text: "Barcode", alignment: "center", bold: true },
            { text: "Date Received", alignment: "center", bold: true },
          ],
          ...itemsArr,
        ],
      },
    },
  ];

  // Document Structure
  let headerfooterDoc = {
    pageSize: "LEGAL",
    pageOrientation: "portrait",
    pageMargins: [40, 120, 40, 120],

    header: (currentPage, pageCount, pageSize) => {
      return {
        margin: [50, 30, 10, 10],
        fontSize: 20,
        columns: [
          {
            text: [
              {
                text: "SIG Items\n\n".toUpperCase(),
                fontSize: 18,
                bold: true,
              },
            ],
            alignment: "center",
          },
        ],
      };
    },

    content,

    // background: function (currentPage, pageSize) {
    //   return {
    //     text: "helo",
    //     height: pageSize.height,
    //     width: pageSize.width,
    //     opacity: 0.05,
    //   };
    // },
    footer: (currentPage, pageCount, pageSize) => {
      return {
        margin: [52, -20, 0, -10],
        fontSize: 10,
        text: [
          {
            text: `${" ".repeat(100)} `,
            alignment: "left",
            decoration: "underline",
            bold: true,
          },
        ],
        columns: [
          {
            text: [
              {
                text: "These are all the items recorded in the system.",
              },
            ],
            bold: true,
            width: 500,
            fontSize: 12,
          },
        ],
      };
    },
  };

  const stream = res.writeHead(200, {
    "Content-Type": "application/pdf",
  });

  let pdfDoc = pdfmake.createPdfKitDocument(headerfooterDoc, {});

  pdfDoc.pipe(stream);
  pdfDoc.end();
});
