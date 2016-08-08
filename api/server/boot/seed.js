const _ = require('underscore');



module.exports = function (server) {
    const ExperimentModel = server.models.Experiment;
    const VariationModel = server.models.Variation;

    const createVariation = (id) => {
        return {
            experimentId: id,
            viewCount: 0,
            goalCount: 0,
            active: true
        }
    }

    const createExperiment = (rdn) => {
        const date = new Date();
        // date.setFullYear(2015);
        const experiment = {
            name: 'Experiment-' + rdn,
            matcher: 'http://random.de',
            created: date,
            active: true
        }
        return ExperimentModel.create(experiment)
            .then(item => item.variations.create(
                _.range(2).map(_ => createVariation(item.id))
            ))
    }
    Promise
        .all(
        _.range(10).map((i) => createExperiment(i))
        )
        .then(_ => ExperimentModel.find({}))
        .then(list => console.log('done', list.length));

}