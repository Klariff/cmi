const fs = require('fs');
const ExcelJS = require('exceljs');
const { db } = require('../db');

// Walks card → category → classification → participant via the joins
// (category_cards is the M2M between categories and cards). Returns the same
// shape the previous mongo aggregation did:
//   [{ _id: <cardCode>, classifications: [{ name, code, participantId, closed, [cardName, categoryName] }] }]
function buildResults(projectId, includeLabels) {
    const rows = db.prepare(`
        SELECT c.code        AS cardCode,
               c.name        AS cardName,
               cls.name      AS classificationName,
               cls.code      AS classificationCode,
               cls.closed    AS classificationClosed,
               cat.code      AS categoryCode,
               cat.name      AS categoryName,
               cls.participantId AS participantId
        FROM cards c
        JOIN category_cards cc  ON cc.cardId = c._id
        JOIN categories cat     ON cat._id = cc.categoryId
        JOIN classifications cls ON cls._id = cat.classificationId
        JOIN participants p     ON p._id = cls.participantId
        WHERE c.projectId = ? AND c.deleted = 0
        ORDER BY p._id, cls.code, cat.code
    `).all(projectId);

    // Group by cardCode preserving the (participant, classification, category) order.
    const groups = new Map();
    for (const r of rows) {
        if (!groups.has(r.cardCode)) groups.set(r.cardCode, []);
        groups.get(r.cardCode).push({
            name: r.classificationName,
            code: r.categoryCode,
            participantId: r.participantId,
            closed: !!r.classificationClosed,
            ...(includeLabels ? { cardName: r.cardName, categoryName: r.categoryName } : {}),
        });
    }

    return Array.from(groups.entries())
        .sort(([a], [b]) => a - b)
        .map(([cardCode, classifications]) => ({ _id: cardCode, classifications }));
}

function buildClassificationHeaders(firstRowClassifications, labeled) {
    const headers = [];
    let lastParticipant = firstRowClassifications[0].participantId;
    let index = 1;
    for (const cls of firstRowClassifications) {
        if (cls.participantId.toString() !== lastParticipant.toString()) index = 1;
        const prefix = (cls.closed ? '*C' : 'C') + index + (labeled ? (' - ' + cls.name) : '');
        headers.push(prefix);
        index++;
        lastParticipant = cls.participantId;
    }
    return headers;
}

function writeCsv(filePath, rows) {
    return new Promise((resolve, reject) => {
        const csv = rows.map(r => r.join(',')).join('\n');
        fs.writeFile(filePath, csv, (err) => err ? reject(err) : resolve(filePath));
    });
}

async function exportCSV(projectId, labeled) {
    const filePath = 'results.csv';
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    const result = buildResults(projectId, labeled);
    if (result.length === 0) return writeCsv(filePath, []);

    const classificationHeaders = ['Item', ...buildClassificationHeaders(result[0].classifications, labeled)];
    const dataRows = result.map(row => {
        const head = labeled ? `${row._id} - ${row.classifications[0].cardName}` : row._id;
        const cells = row.classifications.map(cls => labeled ? `${cls.code} - ${cls.categoryName}` : cls.code);
        return [head, ...cells];
    });
    return writeCsv(filePath, [classificationHeaders, ...dataRows]);
}

module.exports = {
    exportResultsCSV: (projectId) => exportCSV(projectId, false),
    exportLabeledResultsCSV: (projectId) => exportCSV(projectId, true),

    async exportParticipantsExcel(projectId) {
        const filePath = 'participants.xlsx';
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        const participants = db.prepare(`
            SELECT p.*,
                   country.name    AS country_name,
                   department.name AS department_name,
                   city.name       AS city_name,
                   area.name       AS area_name
            FROM participants p
            LEFT JOIN countries    country    ON country._id    = p.countryId
            LEFT JOIN departments department  ON department._id = p.departmentId
            LEFT JOIN cities       city       ON city._id       = p.cityId
            LEFT JOIN areas        area       ON area._id       = p.areaId
            WHERE p.projectId = ? AND p.deleted = 0
            ORDER BY p.surveyDate
        `).all(projectId);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Participantes');
        worksheet.columns = [
            { header: 'ID Participante', key: '_id' },
            { header: 'Nombre completo', key: 'fullName' },
            { header: 'Edad', key: 'age' },
            { header: 'Género', key: 'gender' },
            { header: 'Estrato', key: 'socialLevel' },
            { header: 'Titulo obtenido', key: 'educationalLevel' },
            { header: 'País', key: 'country' },
            { header: 'Región', key: 'department' },
            { header: 'Ciudad', key: 'city' },
            { header: 'Área', key: 'area' },
            { header: 'Observaciones', key: 'observations' },
            { header: 'ID Proyecto', key: 'projectId' },
            { header: 'Fecha de envío', key: 'surveyDate' },
        ];

        for (const p of participants) {
            let surveyDate = '';
            if (p.surveyDate) {
                const d = new Date(p.surveyDate);
                d.setHours(d.getHours() - 5);
                surveyDate = d.toISOString().split('T')[0] + ' ' + d.toISOString().split('T')[1].split('.')[0];
            }
            worksheet.addRow({
                _id: p._id,
                fullName: p.fullName,
                age: p.age,
                gender: p.gender,
                socialLevel: p.socialLevel,
                educationalLevel: p.educationalLevel,
                country: p.country_name || '',
                department: p.department_name || '',
                city: p.city_name || '',
                area: p.area_name || '',
                observations: p.observations,
                projectId: p.projectId,
                surveyDate,
            });
        }

        await workbook.xlsx.writeFile(filePath);
        return filePath;
    },
};
