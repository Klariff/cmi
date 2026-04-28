const participantModel = require('../models/participant.model');
const cardModel = require('../models/card.model');
const fs = require('fs');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const { getCountries, getRegions, getCitiesCountry, getCitiesRegion } = require('./location.service');

module.exports = {
    async exportResultsCSV(projectId) {
        return new Promise(async (resolve, reject) => {
            try {
                const filePath = "results.csv";
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                const result = await cardModel.aggregate([
                    {
                        $match: {
                            projectId: new mongoose.Types.ObjectId(projectId),
                            deleted: false,
                        }
                    },
                    {
                        $lookup: {
                            from: 'categories',
                            localField: '_id',
                            foreignField: 'cardsId',
                            as: 'category',
                        },
                    },
                    {
                        $unwind: '$category',
                    },
                    {
                        $lookup: {
                            from: 'classifications',
                            localField: 'category.classificationId',
                            foreignField: '_id',
                            as: 'classification',
                        },
                    },
                    {
                        $unwind: '$classification',
                    },
                    {
                        $lookup: {
                            from: 'participants',
                            localField: 'classification.participantId',
                            foreignField: '_id',
                            as: 'participant',
                        },
                    },
                    {
                        $unwind: '$participant',
                    },
                    {
                        $project: {
                            cardCode: '$code',
                            classificationName: '$classification.name',
                            classificationCode: '$classification.code',
                            categoryCode: '$category.code',
                            participantId: '$participant._id',
                            classificationClosed: '$classification.closed',
                        },
                    },
                    {
                        $sort: {
                            participantId: 1,
                            classificationCode: 1,
                            categoryCode: 1,
                        },
                    },
                    {
                        $group: {
                            _id: '$cardCode',
                            classifications: {
                                $push: {
                                    name: '$classificationName',
                                    code: '$categoryCode',
                                    participantId: '$participantId',
                                    closed: '$classificationClosed',
                                },
                            },
                        },
                    },
                    {
                        $sort: {
                            _id: 1,
                        },
                    },
                ]);

                if (result.length === 0) {
                    fs.writeFile(filePath, '', (err) => {
                        if (err) { reject(err); } else { resolve(filePath); }
                    });
                    return;
                }

                let classificationHeaders = [];
                let lastParticipant = result[0].classifications[0].participantId;
                let index = 1;
                result[0].classifications.forEach((classification) => {
                    if (classification.participantId.toString() == lastParticipant.toString()) {
                        if (classification.closed) {
                            classificationHeaders.push("*C" + index);
                        } else {
                            classificationHeaders.push("C" + index);
                        }
                        index++;
                    } else {
                        index = 1;
                        if (classification.closed) {
                            classificationHeaders.push("*C" + index);
                        } else {
                            classificationHeaders.push("C" + index);
                        }
                        index++;
                    }
                    lastParticipant = classification.participantId;
                })

                let rowData = [];
                classificationHeaders = ["Item", ...classificationHeaders];
                result.forEach((row) => {
                    let categories = [];
                    row.classifications.forEach((classification) => {
                        categories.push(classification.code)
                    })
                    categories = [row._id, ...categories]
                    rowData.push(categories);
                });

                rowData = [classificationHeaders, ...rowData];

                let csvData = rowData.map(row => row.join(',')).join('\n');

                fs.writeFile(filePath, csvData, (err) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        resolve(filePath);
                    }
                });

            } catch (error) {
                console.error(error);
                reject(error);
            }
        });

    },
    async exportLabeledResultsCSV(projectId) {
        return new Promise(async (resolve, reject) => {
            try {
                const filePath = "results.csv";
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                const result = await cardModel.aggregate([
                    {
                        $match: {
                            projectId: new mongoose.Types.ObjectId(projectId),
                            deleted: false,
                        }
                    },
                    {
                        $lookup: {
                            from: 'categories',
                            localField: '_id',
                            foreignField: 'cardsId',
                            as: 'category',
                        },
                    },
                    {
                        $unwind: '$category',
                    },
                    {
                        $lookup: {
                            from: 'classifications',
                            localField: 'category.classificationId',
                            foreignField: '_id',
                            as: 'classification',
                        },
                    },
                    {
                        $unwind: '$classification',
                    },
                    {
                        $lookup: {
                            from: 'participants',
                            localField: 'classification.participantId',
                            foreignField: '_id',
                            as: 'participant',
                        },
                    },
                    {
                        $unwind: '$participant',
                    },
                    {
                        $project: {
                            cardCode: '$code',
                            cardName: '$name',
                            classificationName: '$classification.name',
                            classificationCode: '$classification.code',
                            categoryCode: '$category.code',
                            categoryName: '$category.name',
                            participantId: '$participant._id',
                            classificationClosed: '$classification.closed',
                        },
                    },
                    {
                        $sort: {
                            participantId: 1,
                            classificationCode: 1,
                            categoryCode: 1,
                        },
                    },
                    {
                        $group: {
                            _id: '$cardCode',
                            classifications: {
                                $push: {
                                    name: '$classificationName',
                                    cardName: '$cardName',
                                    code: '$categoryCode',
                                    categoryName: '$categoryName',
                                    participantId: '$participantId',
                                    closed: '$classificationClosed',
                                },
                            },
                        },
                    },
                    {
                        $sort: {
                            _id: 1,
                        },
                    },
                ]);

                if (result.length === 0) {
                    fs.writeFile(filePath, '', (err) => {
                        if (err) { reject(err); } else { resolve(filePath); }
                    });
                    return;
                }

                let classificationHeaders = [];
                let lastParticipant = result[0].classifications[0].participantId;
                let index = 1;
                result[0].classifications.forEach((classification) => {
                    if (classification.participantId.toString() == lastParticipant.toString()) {
                        if (classification.closed) {
                            classificationHeaders.push("*C" + index + " - " + classification.name);
                        } else {
                            classificationHeaders.push("C" + index + " - " + classification.name);
                        }
                        index++;
                    } else {
                        index = 1;
                        if (classification.closed) {
                            classificationHeaders.push("*C" + index + " - " + classification.name);
                        } else {
                            classificationHeaders.push("C" + index + " - " + classification.name);
                        }
                        index++;
                    }
                    lastParticipant = classification.participantId;
                })

                let rowData = [];
                classificationHeaders = ["Item", ...classificationHeaders];
                result.forEach((row) => {
                    let categories = [];
                    row.classifications.forEach((classification) => {
                        categories.push(classification.code + " - " + classification.categoryName)
                    })
                    categories = [row._id + " - " + row.classifications[0].cardName, ...categories]
                    rowData.push(categories);
                });

                rowData = [classificationHeaders, ...rowData];

                let csvData = rowData.map(row => row.join(',')).join('\n');

                fs.writeFile(filePath, csvData, (err) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        resolve(filePath);
                    }
                });

            } catch (error) {
                console.error(error);
                reject(error);
            }
        });

    },
    async exportParticipantsExcel(projectId) {
        return new Promise(async (resolve, reject) => {
            try {
                const filePath = 'participants.xlsx';
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }

                const participants = await participantModel
                    .find({ projectId: new mongoose.Types.ObjectId(projectId), deleted: false })
                    .populate('countryId', 'name')
                    .populate('departmentId', 'name')
                    .populate('cityId', 'name')
                    .populate('areaId', 'name');

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

                participants.forEach((participant) => {
                    const p = participant.toJSON();
                    let surveyDate = '';
                    if (p.surveyDate) {
                        const auxDate = new Date(p.surveyDate);
                        auxDate.setHours(auxDate.getHours() - 5);
                        surveyDate = auxDate.toISOString().split('T')[0] + ' ' + auxDate.toISOString().split('T')[1].split('.')[0];
                    }
                    worksheet.addRow({
                        _id: p._id?.toString(),
                        fullName: p.fullName,
                        age: p.age,
                        gender: p.gender,
                        socialLevel: p.socialLevel,
                        educationalLevel: p.educationalLevel,
                        country: p.countryId?.name || '',
                        department: p.departmentId?.name || '',
                        city: p.cityId?.name || '',
                        area: p.areaId?.name || '',
                        observations: p.observations,
                        projectId: p.projectId?.toString(),
                        surveyDate,
                    });
                });

                await workbook.xlsx.writeFile(filePath);
                resolve(filePath);
            } catch (error) {
                console.error(error);
                reject(error);
            }
        });
    }
}