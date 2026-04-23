import { getVolunteerPortraitAvatar } from './portraitAvatars';

export type VolunteerShift = {
	id: string;
	eventId: string;
	title: string;
	startTime: string;
	endTime: string;
	needed: number;
	filled: number;
};

export type VolunteerEvent = {
	id: string;
	title: string;
	date: string;
	timeRange: string;
	location: string;
	shifts: VolunteerShift[];
};

export type VolunteerContact = {
	id: string;
	name: string;
	email: string;
	phone?: string;
	businessAffiliation?: string;
	pastEventCount: number;
	totalHours: number;
	lastActive: string;
	avatarUrl: string;
};

export type VolunteerEventTeam = {
	lead: VolunteerContact | null;
	participants: VolunteerContact[];
};

export type VolunteerSeasonStats = {
	totalVolunteers: number;
	totalHours: number;
	eventsHeld: number;
	noShowRate: number;
};

export const volunteerEvents: VolunteerEvent[] = [
	{
		id: 'vol-event-1',
		title: 'Riverside Arts Festival',
		date: 'May 10, 2026',
		timeRange: '8:00 AM – 10:00 PM',
		location: 'Riverside Park, Pavilion A',
		shifts: [
			{
				id: 's1',
				eventId: 'vol-event-1',
				title: 'Check-in & Registration',
				startTime: '8:00 AM',
				endTime: '12:00 PM',
				needed: 10,
				filled: 8
			},
			{
				id: 's2',
				eventId: 'vol-event-1',
				title: 'Beer Garden',
				startTime: '12:00 PM',
				endTime: '8:00 PM',
				needed: 10,
				filled: 10
			},
			{
				id: 's3',
				eventId: 'vol-event-1',
				title: 'Stage Crew',
				startTime: '7:00 AM',
				endTime: '10:00 AM',
				needed: 8,
				filled: 3
			},
			{
				id: 's4',
				eventId: 'vol-event-1',
				title: 'Parking & Traffic',
				startTime: '9:00 AM',
				endTime: '5:00 PM',
				needed: 6,
				filled: 5
			},
			{
				id: 's5',
				eventId: 'vol-event-1',
				title: 'Cleanup Crew',
				startTime: '8:00 PM',
				endTime: '10:00 PM',
				needed: 10,
				filled: 4
			}
		]
	},
	{
		id: 'vol-event-2',
		title: 'Spring Cleanup Drive',
		date: 'Apr 27, 2026',
		timeRange: '9:00 AM – 1:00 PM',
		location: 'Greenway Trail, Mile Marker 3',
		shifts: [
			{
				id: 's6',
				eventId: 'vol-event-2',
				title: 'Trail Cleanup',
				startTime: '9:00 AM',
				endTime: '1:00 PM',
				needed: 20,
				filled: 14
			},
			{
				id: 's7',
				eventId: 'vol-event-2',
				title: 'Supply Distribution',
				startTime: '9:00 AM',
				endTime: '11:00 AM',
				needed: 10,
				filled: 4
			}
		]
	},
	{
		id: 'vol-event-3',
		title: 'Food Pantry Pop-Up',
		date: 'Apr 19, 2026',
		timeRange: '10:00 AM – 2:00 PM',
		location: 'St. Michael Community Center',
		shifts: [
			{
				id: 's8',
				eventId: 'vol-event-3',
				title: 'Food Distribution',
				startTime: '10:00 AM',
				endTime: '2:00 PM',
				needed: 15,
				filled: 15
			},
			{
				id: 's9',
				eventId: 'vol-event-3',
				title: 'Registration Table',
				startTime: '10:00 AM',
				endTime: '12:00 PM',
				needed: 8,
				filled: 8
			},
			{
				id: 's10',
				eventId: 'vol-event-3',
				title: 'Parking Attendant',
				startTime: '9:30 AM',
				endTime: '2:30 PM',
				needed: 5,
				filled: 5
			}
		]
	}
];

const rawVolunteerContacts = [
	{
		id: 'vc1',
		name: 'Megan Carter',
		email: 'megan.carter@gmail.com',
		businessAffiliation: 'Cape Shore Bank',
		pastEventCount: 7,
		totalHours: 42,
		lastActive: 'Apr 19, 2026'
	},
	{
		id: 'vc2',
		name: 'Tyler Dawson',
		email: 'tyler@dawsongrounds.com',
		phone: '(312) 555-0182',
		businessAffiliation: 'Dawson Grounds Co.',
		pastEventCount: 5,
		totalHours: 28,
		lastActive: 'Apr 19, 2026'
	},
	{
		id: 'vc3',
		name: 'Lauren Mitchell',
		email: 'lauren.mitchell@mitchelllaw.com',
		businessAffiliation: 'Mitchell Family Law',
		pastEventCount: 4,
		totalHours: 24,
		lastActive: 'Apr 7, 2026'
	},
	{
		id: 'vc4',
		name: 'Brooke Simmons',
		email: 'brooke.simmons@harboryouth.org',
		businessAffiliation: 'Harbor Youth Sailing',
		pastEventCount: 3,
		totalHours: 18,
		lastActive: 'Mar 15, 2026'
	},
	{
		id: 'vc5',
		name: 'Connor Hayes',
		email: 'connor.hayes@hotmail.com',
		phone: '(773) 555-0341',
		businessAffiliation: 'West End Hardware',
		pastEventCount: 6,
		totalHours: 36,
		lastActive: 'Apr 19, 2026'
	},
	{
		id: 'vc6',
		name: 'Erin Wallace',
		email: 'erin.wallace@northsidehealth.org',
		businessAffiliation: 'Northside Health Clinic',
		pastEventCount: 2,
		totalHours: 12,
		lastActive: 'Feb 28, 2026'
	},
	{
		id: 'vc7',
		name: 'Garrett Cole',
		email: 'garrett.cole@gmail.com',
		businessAffiliation: 'Cape Sound Collective',
		pastEventCount: 8,
		totalHours: 48,
		lastActive: 'Apr 19, 2026'
	},
	{
		id: 'vc8',
		name: 'Melissa Hart',
		email: 'melissa@hartcatering.com',
		businessAffiliation: 'Hart Catering Co.',
		pastEventCount: 5,
		totalHours: 30,
		lastActive: 'Apr 7, 2026'
	}
] satisfies Array<Omit<VolunteerContact, 'avatarUrl'>>;

export const volunteerContacts: VolunteerContact[] = rawVolunteerContacts.map((contact) => ({
	...contact,
	avatarUrl: getVolunteerPortraitAvatar(contact.id)
}));

const volunteerEventTeamIds: Record<string, { leadId: string; participantIds: string[] }> = {
	'vol-event-1': {
		leadId: 'vc1',
		participantIds: ['vc7', 'vc5', 'vc8']
	},
	'vol-event-2': {
		leadId: 'vc3',
		participantIds: ['vc2', 'vc6', 'vc4']
	},
	'vol-event-3': {
		leadId: 'vc5',
		participantIds: ['vc1', 'vc7', 'vc3']
	}
};

export function findVolunteerContactByName(name: string): VolunteerContact | undefined {
	return volunteerContacts.find((contact) => contact.name === name);
}

export function getVolunteerContactById(id: string): VolunteerContact | undefined {
	return volunteerContacts.find((contact) => contact.id === id);
}

export function getVolunteerEventTeam(eventId: string): VolunteerEventTeam {
	const assignment = volunteerEventTeamIds[eventId];
	if (!assignment) {
		return {
			lead: null,
			participants: []
		};
	}

	return {
		lead: getVolunteerContactById(assignment.leadId) ?? null,
		participants: assignment.participantIds
			.map((contactId) => getVolunteerContactById(contactId))
			.filter((contact): contact is VolunteerContact => Boolean(contact))
	};
}

export const volunteerSeasonStats: VolunteerSeasonStats = {
	totalVolunteers: 127,
	totalHours: 432,
	eventsHeld: 8,
	noShowRate: 0.073
};

export function getVolunteerEvent(id: string): VolunteerEvent | undefined {
	return volunteerEvents.find((e) => e.id === id);
}

export function getEventTotalSlots(event: VolunteerEvent): number {
	return event.shifts.reduce((sum, s) => sum + s.needed, 0);
}

export function getEventFilledSlots(event: VolunteerEvent): number {
	return event.shifts.reduce((sum, s) => sum + s.filled, 0);
}

export type FillStatus = 'full' | 'need-more' | 'open';

export function getFillStatus(filled: number, needed: number): FillStatus {
	if (filled >= needed) return 'full';
	if (needed - filled <= 3) return 'open';
	return 'need-more';
}

export function getFillLabel(filled: number, needed: number): string {
	if (filled >= needed) return 'Full';
	const remaining = needed - filled;
	return `Need ${remaining} more`;
}
