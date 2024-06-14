'use strict';

const axios = require('axios');

const likesStore = {}; // In-memory store for likes

module.exports = function (app) {
  app.route('/api/stock-prices')
    .get(async function (req, res) {
      try {
        const { stock, like } = req.query;
        const ip = req.ip;

        // Function to fetch stock price
        const fetchStockData = async (symbol) => {
          const response = await axios.get(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`);
          return response.data;
        };

        // Function to handle likes
        const handleLikes = (symbol) => {
          if (!likesStore[symbol]) {
            likesStore[symbol] = new Set();
          }
          if (like === 'true') {
            likesStore[symbol].add(ip);
          }
          return likesStore[symbol].size;
        };

        // If only one stock is provided
        if (typeof stock === 'string') {
          const data = await fetchStockData(stock.toUpperCase());
          const likes = handleLikes(stock.toUpperCase());
          res.json({
            stockData: {
              stock: data.symbol,
              price: data.latestPrice,
              likes: likes
            }
          });
        }

        // If multiple stocks are provided
        if (Array.isArray(stock)) {
          const [stock1, stock2] = stock.map(s => s.toUpperCase());
          const data1 = await fetchStockData(stock1);
          const data2 = await fetchStockData(stock2);

          const likes1 = handleLikes(stock1);
          const likes2 = handleLikes(stock2);

          res.json({
            stockData: [
              {
                stock: data1.symbol,
                price: data1.latestPrice,
                rel_likes: likes1 - likes2
              },
              {
                stock: data2.symbol,
                price: data2.latestPrice,
                rel_likes: likes2 - likes1
              }
            ]
          });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching stock data' });
      }
    });
};
