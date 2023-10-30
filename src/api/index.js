const axios = require("axios");

module.exports = {
    mapbox: async (...params) => {
        try {
          const data = await axios(...params)
          return data.data
        } catch (e) {
          return {Error: e.message}
        }
      }
}