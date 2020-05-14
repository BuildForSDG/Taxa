const getYear = (date) => {
  const dateObject = new Date(date);
  return dateObject.getFullYear();
};

const getMonth = (date) => {
  const dateObject = new Date(date);
  return (dateObject.getMonth() + 1);
};

const getMonthName = (number) => {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return monthNames[number - 1];
};

exports.getMonthName = getMonthName;
exports.getYear = getYear;
exports.getMonth = getMonth;
