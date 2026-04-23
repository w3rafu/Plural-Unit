export const memberPortraitAvatars: Record<string, string> = {
	'profile-ariana-lopez': '/portraits/portrait-08.jpg',
	'profile-nico-park': '/portraits/portrait-05.jpg',
	'profile-elena-rossi': '/portraits/portrait-02.jpg',
	'profile-malik-johnson': '/portraits/portrait-01.jpg',
	'profile-priya-desai': '/portraits/portrait-06.jpg',
	'profile-tomas-ibarra': '/portraits/portrait-07.jpg',
	'profile-yara-haddad': '/portraits/portrait-04.jpg',
	'profile-lucia-costa': '/portraits/portrait-03.jpg'
};

export const volunteerPortraitAvatars: Record<string, string> = {
	vc1: '/portraits/portrait-16.jpg',
	vc2: '/portraits/portrait-12.jpg',
	vc3: '/portraits/portrait-14.jpg',
	vc4: '/portraits/portrait-11.jpg',
	vc5: '/portraits/portrait-09.jpg',
	vc6: '/portraits/portrait-10.jpg',
	vc7: '/portraits/portrait-15.jpg',
	vc8: '/portraits/portrait-13.jpg'
};

export function getMemberPortraitAvatar(profileId: string, currentAvatarUrl = '') {
	return currentAvatarUrl || memberPortraitAvatars[profileId] || '';
}

export function getVolunteerPortraitAvatar(contactId: string, currentAvatarUrl = '') {
	return currentAvatarUrl || volunteerPortraitAvatars[contactId] || '';
}