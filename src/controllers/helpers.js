module.exports = {
  header: (payload, pageSize, logo, cesn) => {
    return {
      margin: [20, 20, 10, 10],
      fontSize: 10,
      lineHeight: 1.5,
      color: "grey",

      columns: [
        {
          absolutePosition: { x: 50, y: 10 },
          image: logo,
          fit: [80, 90],
          alignment: "left",
        },
        {
          text: [
            {
              text: "Republic of South Sudan\n".toUpperCase(),
              fontSize: 14,
              color: "black",
              bold: true,
            },

            {
              text: "Central Equatoria\n".toUpperCase(),
            },
            {
              text: "Juba City Council\n".toUpperCase(),
            },
            {
              text: `${payload ? payload : ""}\n`.toUpperCase(),
            },
            {
              text: "Director's Office".toUpperCase(),
            },
          ],
          alignment: "center",
          // width: 300
        },

        {
          absolutePosition: { x: pageSize.width * 0.75, y: 20 },
          image: cesn,
          fit: [70, 60],
          alignment: "center",
        },
      ],

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
    };
  },

  footer: (stateman) => {
    return {
      margin: [50, 0, 20, 0],
      fontSize: 10,

      columns: [
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
          absolutePosition: { x: 60, y: 20 },
          text: [
            { text: "Disclaimer: ", bold: true },
            {
              text: "This is a system generated bill and therefore it does not require a stamp",
            },
          ],
          width: 500,
          fontSize: 9,
        },
        {
          absolutePosition: { x: 55, y: 30 },
          image: stateman,
          fit: [30, 30],
          alignment: "right",
          margin: [0, 0, 90, 0],
        },
        {
          absolutePosition: { x: 55, y: 40 },
          text: [
            {
              text: "Powered By Stateman",
              fontSize: 8,
              bold: true,
            },
          ],
          alignment: "right",
          margin: [-10, 0, 100, 10],
        },
      ],
    };
  },
};
