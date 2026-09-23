const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const desktopPath = require('os').homedir() + '\\OneDrive\\Desktop\\HR_Policy_Valid.pdf';
const doc = new PDFDocument();

doc.pipe(fs.createWriteStream(desktopPath));

doc.fontSize(25).text('Global HR Policy - 2026', { align: 'center' });
doc.moveDown();
doc.fontSize(14).text('1. Paid Time Off (PTO)');
doc.fontSize(12).text('All full-time employees are entitled to 25 days of Paid Time Off per year. This includes vacation and personal days. Sick leave is calculated separately at 10 days per year.');
doc.moveDown();
doc.fontSize(14).text('2. Remote Work Policy');
doc.fontSize(12).text('Employees are allowed to work remotely up to 3 days per week. Mondays and Thursdays are mandatory in-office days for team collaboration.');
doc.moveDown();
doc.fontSize(14).text('3. Hardware & Equipment');
doc.fontSize(12).text('Every employee is provided with a standard equipment budget of $1,500 every two years to purchase laptops, monitors, and ergonomic accessories.');
doc.moveDown();
doc.fontSize(14).text('4. Secret Code');
doc.fontSize(12).text('The secret emergency code for HR overrides is ALPHA-99-OMEGA. Do not share this with other departments.');

doc.end();

console.log('Created valid PDF at: ' + desktopPath);

