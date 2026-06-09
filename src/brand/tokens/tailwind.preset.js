/**
 * LaunchDarkly Brand — Tailwind Preset (2026 Brand Library)
 */

export default {
  theme: {
    extend: {
      colors: {
        ld: {
          white:    "#FFFFFF",
          "gray-01": "#F8F8F8",
          "gray-02": "#D1D6D9",
          "gray-03": "#A7A9AC",
          "gray-04": "#6D6E71",
          "gray-05": "#414042",
          "gray-06": "#2C2C2C",
          black:    "#191919",
          blue:    "#405BFF",
          cyan:    "#3DD6F5",
          lime:    "#DDFF46",
          purple:  "#A34FDE",
          pink:    "#FF35A2",
          orange:  "#FF9D29",
          "blue-light":    "#7084FF",
          "cyan-light":    "#6DE0F7",
          "lime-light":    "#EDFF9E",
          "purple-light":  "#B675E4",
          "pink-light":    "#EE5DAC",
          "orange-light":  "#FFB660",
          "blue-dark":    "#2A3BA6",
          "cyan-dark":    "#238CA3",
          "lime-dark":    "#ADD300",
          "purple-dark":  "#6A3390",
          "pink-dark":    "#C51A77",
          "orange-dark":  "#D57B10",
        },
      },
      backgroundImage: {
        "gradient-ld-purple-blue":      "linear-gradient(135deg, #A34FDE, #405BFF)",
        "gradient-ld-pink-orange-lime": "linear-gradient(135deg, #FF35A2, #FF9D29, #DDFF46)",
        "gradient-ld-purple-pink":      "linear-gradient(135deg, #A34FDE, #FF35A2)",
        "gradient-ld-cyan-blue":        "linear-gradient(135deg, #3DD6F5, #405BFF)",
        "gradient-ld-cyan-lime":        "linear-gradient(135deg, #3DD6F5, #DDFF46)",
        "gradient-ld-purple-blue-cyan": "linear-gradient(135deg, #A34FDE, #405BFF, #3DD6F5)",
      },
      fontFamily: {
        "ld-display": ["Sora", "system-ui", "-apple-system", "sans-serif"],
        "ld-body":    ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
};
