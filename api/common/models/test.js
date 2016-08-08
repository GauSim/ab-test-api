const _ = require('underscore');


function rdn(x, y) {
    return Math.floor(Math.random() * ((y - x) + 1) + x);
}

function getRadomVariationId(variations) {
    const activeIds = variations.filter(e => e.active).map(e => e.id);
    return _.sample(activeIds, 1)[0];
}

function getAppFormModel(model) {
    return () => new Promise((ok, fail) => {
        model.getApp((err, app) => {
            if (err) {
                fail(err);
            } else {
                ok(app);
            }
        });
    });
}

const getVariationForTest = (currentExperiment) => {
    return currentExperiment.variations.getAsync()
        .then(variations => {
            return getRadomVariationId(variations);
        }).then(variationId => {
            return currentExperiment.variations.findById(variationId);
        })
        .then(variation => {
            // add count 
            variation.viewCount += 1;
            return variation.save();
        }).then(variation => {
            return Object.assign({}, { variationId: variation.id }, { experimentName: currentExperiment.name });
        })
}

module.exports = function (TestModel) {
    const getAppAsync = getAppFormModel(TestModel);

    TestModel.for = (matcher, callback) => {
        getAppAsync()
            .then(app => {
                const ExperimentModel = app.models.Experiment;

                return ExperimentModel.find({ where: { matcher: matcher, active: true } })
                    .then(tests => {
                        return Promise.all(
                            tests.map(test => getVariationForTest(test))
                        )
                    });
            })
            .then(result => callback(null, result))
            .catch(error => {
                console.log('err', error);
                callback(error, null);
            });
    };

    TestModel.remoteMethod('for',
        {
            description: 'dinge',
            accepts: [
                {
                    arg: 'matcher',
                    type: 'string',
                    required: true
                }
            ],
            returns: {
                arg: 'activeExperiments',
                type: 'array'
            }
        }
    );

    TestModel.goal = (activeExperiments, callback) => {

        getAppAsync()
            .then(app => {
                const VariationModel = app.models.Variation;

                const updates = activeExperiments.map(exp => {
                    VariationModel.findById(exp.variationId)
                        .then(variation => {
                            variation.goalCount += 1;
                            return variation.save();
                        });
                });

                return Promise.all(updates)
            })
            .then(_ => callback(null, { ok: true }))
            .catch(e => callback(e))
    };

    TestModel.remoteMethod('goal',
        {
            http: {
                path: '/goal',
                verb: 'post'
            },
            description: 'dinge',
            accepts: {
                arg: 'activeExperiments',
                type: [
                    {
                        "type": {
                            name: 'String'
                        }
                    }
                ],
                required: true
            },
            returns: {
                arg: 'ok',
                type: 'boolean'
            }
        }
    )
};
