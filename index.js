import {resolve} from 'path';
import {existsSync, readFileSync, writeFileSync} from 'fs';
import fetch from 'node-fetch';

async function get(endpoint, id, args) {
	const cache = resolve('cache', [endpoint, id].filter(Boolean).join('-') + '.json');
	if (existsSync(cache)) {
		console.log('Returning cached file', cache);
		return JSON.parse(readFileSync(cache), 'utf8');
	} else {
		const url = `http://www.odata.charities.govt.nz/${endpoint}?$returnall=true&$format=json${Object.entries(args).map(([key, value]) => '&$' + key + '=' + value)}`;
		console.log('No cached file, fetching', url);
		const response = await fetch(url);
		const data = await response.json();
		writeFileSync(cache, JSON.stringify(data.d, null, '\t'));
		return data.d;
	}
}

async function main() {
	const orgs = await get('Organisations', null, {select: 'OrganisationId,CharityRegistrationNumber,Name,Organisational_type,RegistrationStatus', filter: 'MainActivityId eq 8 or MainSectorId eq 15'});
	// const returns = await get('GrpOrgAllReturns', null, {select: 'OrganisationId,CharityRegistrationNumber,Name,Organisational_type,RegistrationStatus', filter: 'MainActivityId eq 8 or MainSectorId eq 15'});
	for (const org of orgs) {
		// const returns = await get(`Organisations(${org.OrganisationId})/AnnualReturn`);
		const returns = await get('GrpOrgAllReturns', org.OrganisationId, {filter: `Id eq ${org.OrganisationId}`});
		// const source = await get(`Organisations(${org.OrganisationId})/SourceOfFunds`);
		// const officers = await get(`Organisations(${org.OrganisationId})/Officers`);
		const surplus = returns.map((ret) => ret.Netsurplusdeficitfortheyear).reduce((a, b) => a + b, 0);
		console.log(org.Name, surplus);
	}
}

main();
