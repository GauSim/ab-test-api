
import 'rxjs/add/operator/toPromise'; // magic adds the .toPromise func to streams
import * as _ from 'underscore';


import { Component } from '@angular/core';
import { HTTP_PROVIDERS, Http, Headers } from '@angular/http';
import { OrderByPipe} from './shared/OrderByPipe';

@Component({
  moduleId: module.id,
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: [ 'app.component.css'],
  providers: [ HTTP_PROVIDERS ],
  pipes: [ OrderByPipe ]
})
export class AppComponent {

  constructor(private http: Http) {
    this.sync();
  }

  experiments: any[] = [];
  completedSimulations: number = 0;
  intervalHandlerId: number = null;

  sync = () => {
    const filter = { include: "variations" };
    return this.http
      .get('http://localhost:3000/api/Experiments?filter=' + JSON.stringify(filter))
      .toPromise()
      .then(res => res.json() as DBExperiment[])
      .then((experimentsList: DBExperiment[]) => {
        experimentsList.forEach(e => {

          e.totalCount = e.totalCount ? e.totalCount : 0
          e.variations.forEach(vario => {
            e.totalCount += vario.viewCount;
            vario.cvr_for_sort = (100 / vario.viewCount) * vario.goalCount;
            vario.cvr = vario.cvr_for_sort.toFixed(2);
          });

        });

        this.experiments = experimentsList
      });
  }

  toggleSimulation = () => {
    if (this.intervalHandlerId) {
      clearInterval(this.intervalHandlerId);
      this.intervalHandlerId = null;
    } else {
      this.intervalHandlerId = setInterval(this.simulate, 100);
    }
  }

  simulate = () => {
    const postData = { matcher: 'http://random.de' };
    return this.http.post('http://localhost:3000/api/Tests/for', postData).toPromise()
      .then(res => res.json() as ABTEST)
      .then(abTest => {

        // simulate 50% of the Experiments to fail
        const data = {
          activeExperiments: _.sample(abTest.activeExperiments, Math.round(abTest.activeExperiments.length / 2))
        }

        return this.http.post('http://localhost:3000/api/Tests/goal', data).toPromise();
      })
      .then(_ => (this.completedSimulations += 1))
      .then(_ => this.sync());
  }
}



interface DBExperiment {
  active: boolean;
  created: string;
  id: number;
  matcher: string;
  name: string;
  totalCount: number;
  variations: {
    active: boolean;
    experimentId: number;
    goalCount: number;
    id: number;
    viewCount: number;
    cvr: string;
    cvr_for_sort: number;
  }[];
}

interface IABExperiment {
  experimentName: string;
  variationId: number;
}
interface ABTEST {
  activeExperiments: IABExperiment[]
}
