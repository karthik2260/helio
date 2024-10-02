const orderdb = require('../../model/ordermodel');
const PDFDocument = require('pdfkit-table');
const moment = require('moment');
const ExcelJS = require('exceljs');



const dailyChart = async (req, res) => {
    try {
        const dailySales = await orderdb.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderedDate" } },
                    totalSales: { $sum: "$totalAmount" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);
        
        res.status(200).json(dailySales);


    } catch (error) {
        console.log(error);
        res.status(500).redirect('/error500')

    }

}


const monthlySales = async (req, res) => {
    try {
        const monthlySales = await orderdb.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$orderedDate" } },
                    totalSales: { $sum: "$totalAmount" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);
      
        res.status(200).json(monthlySales);


    } catch (error) {
        console.log(error);
        res.status(500).redirect('/error500')

    }
}



const yearlySales = async (req, res) => {
    try {
        const yearlySales = await orderdb.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y", date: "$orderedDate" } },
                    totalSales: { $sum: "$totalAmount" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);
       
        res.status(200).json(yearlySales);



    } catch (error) {
        console.log(error);
        res.status(500).redirect('/error500')


    }
}



const get_report=async(req,res)=>{
try {
    res.render('admin/sales_report')
} catch (error) {
    console.log(error);
    res.redirect('/error500')
}
}


const generateReport = async (req, res) => {
    try {
        const { filterType, startDate, endDate, reportType } = req.query;
      
        let salesData;
        let dailySalesData;
        let reportTitle;

        if (filterType === 'daily') {
            salesData = await getDailySales();
            dailySalesData = salesData;
            reportTitle = 'Today';
        } else if (filterType === 'weekly') {
            salesData = await getWeeklySales();
            dailySalesData = salesData;
            reportTitle = `This Week`;
        } else if (filterType === 'monthly') {
            salesData = await getMonthlySales();
            dailySalesData = salesData;
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            reportTitle = monthNames[new Date().getMonth()]; 
        } else if (filterType === 'yearly') {
            salesData = await getYearlySales();
            dailySalesData = salesData;
            reportTitle = `Yearly Sales Report (${new Date().getFullYear()})`;
        } else if (filterType === 'custom') {
            if (!startDate || !endDate) {
                throw new Error('Custom date range requires both start date and end date.');
            }
            salesData = await getCustomRangeSales(startDate, endDate);
            dailySalesData = salesData;
            reportTitle = `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
        }
       

        if (reportType === 'pdf') {
            generatePDFReport(res, reportTitle, salesData, dailySalesData); // Pass dailySalesData here
        } else if (reportType === 'excel') {
            generateExcelReport(res, reportTitle, salesData, dailySalesData);
        } else if (reportType === 'html') {
            generateHTMLReport(res, reportTitle, salesData, dailySalesData);
        } else {
            res.status(400).json({ message: 'Invalid report type' });
        }
    } catch (error) {
        console.error(error);
        res.render('error500');
    }
};

async function generatePDFReport(res, reportTitle, salesData, dailySalesData) {
    try {
        const doc = new PDFDocument();
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename=sales_report.pdf`,
                'Content-Length': pdfData.length
            });
            res.end(pdfData);
        });

        doc.fontSize(20).text(`HELIO`, { align: 'center' });
        doc.fontSize(18).text(`Sales Report (${reportTitle})`, { align: 'center' });
        doc.moveDown();

        // Overall Sales Report Table
        doc.fontSize(16).text('Sales Report', { underline: true });
        const overallTableHeaders = ['Date', 'Total Sales', 'Total Order Amount', 'Coupon Discount'];
        const overallTableData = dailySalesData.map(({ date, totalSales, totalOrderAmount, couponDiscount }) =>
            [new Date(date).toLocaleDateString(), totalSales, 'Rs. ' + totalOrderAmount, 'Rs. ' + couponDiscount]
        );
        const { totalSalesSum, totalOrderAmountSum, totalCouponDiscountSum } = calculateTotalSums(dailySalesData);
        generateTable(doc, overallTableHeaders, overallTableData, totalSalesSum, totalOrderAmountSum, totalCouponDiscountSum);

        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating PDF report' });
    }
}

function calculateTotalSums(dailySalesData) {
    let totalSalesSum = 0;
    let totalOrderAmountSum = 0;
    let totalCouponDiscountSum = 0;

    dailySalesData.forEach(({ totalSales, totalOrderAmount, couponDiscount }) => {
        totalSalesSum += totalSales;
        totalOrderAmountSum += totalOrderAmount;
        totalCouponDiscountSum += couponDiscount;
    });

    return {
        totalSalesSum,
        totalOrderAmountSum,
        totalCouponDiscountSum
    };
}

async function generateTable(doc, headers, data, totalSalesSum, totalOrderAmountSum, totalCouponDiscountSum) {
    const tableData = [...data, ['Total:', totalSalesSum, 'Rs. ' + totalOrderAmountSum, 'Rs. ' + totalCouponDiscountSum]];

    doc.table({
        headers: headers,
        rows: tableData,
        widths: Array(headers.length).fill('*'), // Equal width for all columns
        heights: 20,
        headerRows: 1
    });
}

async function getYearlySales() {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31);
    return await getOrderData(startOfYear, endOfYear);
}

async function getDailySales() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    return await getOrderData(startOfDay, endOfDay);
}

async function getWeeklySales() {
    const today = new Date();
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 7);
    return await getOrderData(startOfWeek, endOfWeek);
}

async function getMonthlySales() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return await getOrderData(startOfMonth, endOfMonth);
}

async function getCustomRangeSales(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return await getOrderData(start, end);
}

async function getOrderData(startDate, endDate) {
    const orders = await orderdb.find({ orderedDate: { $gte: startDate, $lt: endDate } }).populate('items.productId');

    let dailySalesData = [];

    orders.forEach(order => {
        let totalSales = 0;
        let totalOrderAmount = order.totalAmount;
        let totalOfferPrice = 0;
        let couponDiscount = 0;

        order.items.forEach(item => {
            totalSales += item.quantity;
            const productPrice = item.price * item.quantity;

            // Ensure item.productId is not null and has offerPrice property
            if (item.productId && item.productId.offerPrice !== undefined) {
                totalOfferPrice += item.productId.offerPrice;
            } else {
                console.warn(`Missing or invalid offer price for item: ${item.productId}`);
            }
        });

        // Calculate the coupon discount as TotalAmount - OfferPrice
        couponDiscount = totalOrderAmount - totalOfferPrice;

        dailySalesData.push({
            date: order.orderedDate,
            totalSales,
            totalOrderAmount,
            couponDiscount
        });
    });

    // Sort the daily sales data by order date in ascending order
    dailySalesData.sort((a, b) => a.date - b.date);

    return dailySalesData;
}

async function generateExcelReport(res, reportTitle, salesData, dailySalesData) {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');
        worksheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Total Sales', key: 'totalSales', width: 15 },
            { header: 'Total Order Amount', key: 'totalOrderAmount', width: 20 },
            { header: 'Coupon Discount', key: 'couponDiscount', width: 20 }
        ];
        worksheet.mergeCells('A1:D1');
        worksheet.getCell('A1').value = `HELIO- ${reportTitle}`;
        worksheet.addRow(['Date', 'Total Sales', 'Total Order Amount', 'Coupon Discount']);

        // Add data rows
        dailySalesData.forEach(({ date, totalSales, totalOrderAmount, couponDiscount }) => {
            worksheet.addRow({ date: new Date(date).toLocaleDateString(), totalSales, totalOrderAmount: 'Rs. ' + totalOrderAmount, couponDiscount: 'Rs. ' + couponDiscount });
        });

        // Add total sums row
        const { totalSalesSum, totalOrderAmountSum, totalCouponDiscountSum } = calculateTotalSums(dailySalesData);
        worksheet.addRow(['Total:', totalSalesSum, 'Rs. ' + totalOrderAmountSum, 'Rs. ' + totalCouponDiscountSum]);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating Excel report' });
    }
}

module.exports = {
    monthlySales,
    dailyChart,
    yearlySales,
    get_report,
    generateReport
};
