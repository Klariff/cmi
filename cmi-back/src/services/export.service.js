const participantModel = require('../models/participant.model');
const cardModel = require('../models/card.model');
const fs = require('fs');
const mongoose = require('mongoose');
const xlsx = require('xlsx');
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
                    categories = [row.classifications[0].code + " - " + row.classifications[0].cardName, ...categories]
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

                let participants = await participantModel
                    .find({ projectId: new mongoose.Types.ObjectId(projectId), deleted: false })
                    .populate('countryId', 'name')
                    .populate('departmentId', 'name')
                    .populate('cityId', 'name')
                    .populate('areaId', 'name');

                let headers = [
                    { newName: "ID Participante", oldName: "_id" },
                    { newName: "Nombre completo", oldName: "fullName" },
                    { newName: "Edad", oldName: "age" },
                    { newName: "Género", oldName: "gender" },
                    { newName: "Estrato", oldName: "socialLevel" },
                    { newName: "Titulo obtenido", oldName: "educationalLevel" },
                    { newName: "País", oldName: "countryId", transform: (v) => v?.name || '' },
                    { newName: "Región", oldName: "departmentId", transform: (v) => v?.name || '' },
                    { newName: "Ciudad", oldName: "cityId", transform: (v) => v?.name || '' },
                    { newName: "Área", oldName: "areaId", transform: (v) => v?.name || '' },
                    { newName: "Observaciones", oldName: "observations" },
                    { newName: "ID Proyecto", oldName: "projectId" },
                    { newName: "Fecha de envío", oldName: "surveyDate" },
                ];

                participants = participants.map(async (participant) => {
                    participant = participant.toJSON();
                    for (let attribute in participant) {
                        if (attribute == "projectId" || attribute == "_id") {
                            participant[attribute] = participant[attribute].toString();
                        } else if (attribute == "surveyDate") {
                            let auxDate = new Date(participant[attribute]);
                            auxDate.setHours(auxDate.getHours() - 5);
                            participant[attribute] = auxDate.toISOString().split('T')[0] + " " + auxDate.toISOString().split('T')[1].split('.')[0];
                        }
                        let newTitle = headers.find(header => header.oldName == attribute);
                        if (newTitle) {
                            participant[newTitle.newName] = newTitle.transform ? newTitle.transform(participant[attribute]) : participant[attribute];
                            delete participant[attribute];
                        } else {
                            delete participant[attribute];
                        }
                    }
                    return participant;
                });

                let result = await Promise.all(participants);

                let workbook = xlsx.utils.book_new();
                let worksheet = xlsx.utils.json_to_sheet(result);

                xlsx.utils.book_append_sheet(workbook, worksheet);
                xlsx.writeFile(workbook, filePath);

                resolve(filePath);
            } catch (error) {
                console.error(error);
                reject(error);
            }
        });
    }
}