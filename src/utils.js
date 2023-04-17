const getRandom = function (min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
};

const timer = function (timeout, callback, perSecCallback) {
  if (!callback) throw new Error("Callback should be provided!");
  let i = 0;

  const intervalId = setInterval(() => {
    if (perSecCallback && typeof perSecCallback === "function") {
      perSecCallback(i);
    }

    i++;

    if (i === timeout) {
      callback();
      clearInterval(intervalId);
    }
  }, 1000);
};

module.exports = { getRandom, timer };
