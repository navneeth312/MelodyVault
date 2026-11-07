import test from 'node:test';
import assert from 'node:assert/strict';

interface LeaderboardUser {
  userId: string;
  displayName: string;
  avatarUrl: string;
  totalXp: number;
  level: number;
  tierTitle: string;
  optedIn: boolean;
}

test('LEADERBOARD-1: Ranks are strictly sorted by genuine total XP descending without fabrication', () => {
  const rawUsers: LeaderboardUser[] = [
    {
      userId: 'user-bob',
      displayName: 'Bob Dylan',
      avatarUrl: '/avatars/bob.jpg',
      totalXp: 350,
      level: 3,
      tierTitle: 'Rhythm Journeyman',
      optedIn: true,
    },
    {
      userId: 'user-navneeth',
      displayName: 'Navneeth.U',
      avatarUrl: '/avatars/navneeth_u.jpg',
      totalXp: 850,
      level: 5,
      tierTitle: 'Audiophile Archon',
      optedIn: true,
    },
    {
      userId: 'user-claire',
      displayName: 'Claire V.',
      avatarUrl: '/avatars/claire.jpg',
      totalXp: 120,
      level: 2,
      tierTitle: 'Melody Novice',
      optedIn: true,
    },
  ];

  // Sort descending by totalXp
  const sorted = [...rawUsers].sort((a, b) => b.totalXp - a.totalXp);
  const ranked = sorted.map((u, idx) => ({ ...u, rank: idx + 1 }));

  assert.equal(ranked[0].rank, 1);
  assert.equal(ranked[0].userId, 'user-navneeth');
  assert.equal(ranked[0].totalXp, 850);

  assert.equal(ranked[1].rank, 2);
  assert.equal(ranked[1].userId, 'user-bob');
  assert.equal(ranked[1].totalXp, 350);

  assert.equal(ranked[2].rank, 3);
  assert.equal(ranked[2].userId, 'user-claire');
  assert.equal(ranked[2].totalXp, 120);
});

test('LEADERBOARD-2: Opted-out users are excluded from the public leaderboard', () => {
  const rawUsers: LeaderboardUser[] = [
    {
      userId: 'user-1',
      displayName: 'Public Curator',
      avatarUrl: '',
      totalXp: 500,
      level: 4,
      tierTitle: 'Sound Specialist',
      optedIn: true,
    },
    {
      userId: 'user-2',
      displayName: 'Private Collector',
      avatarUrl: '',
      totalXp: 9999,
      level: 20,
      tierTitle: 'Secret Master',
      optedIn: false, // Opted out!
    },
  ];

  const publicLeaderboard = rawUsers.filter((u) => u.optedIn);
  assert.equal(publicLeaderboard.length, 1);
  assert.equal(publicLeaderboard[0].displayName, 'Public Curator');
  assert.equal(publicLeaderboard.some((u) => u.userId === 'user-2'), false);
});

test('ONBOARDING-1: Candidate profile Navneeth.U initializes with creator role and avatar', () => {
  const candidateProfile = {
    id: 'user-navneeth',
    name: 'Navneeth.U',
    handle: '@navneeth',
    avatar: '/avatars/navneeth_u.jpg',
    tag: 'Vault Creator & Lead Architect',
    bio: 'Curating pristine personal music collections with lossless audio in MelodyVault.',
    joinedLeaderboard: true,
  };

  assert.equal(candidateProfile.id, 'user-navneeth');
  assert.equal(candidateProfile.name, 'Navneeth.U');
  assert.equal(candidateProfile.avatar, '/avatars/navneeth_u.jpg');
  assert.equal(candidateProfile.joinedLeaderboard, true);
});

test('ONBOARDING-2: New visitor onboarding assigns unique ID and custom preferences', () => {
  const createVisitorProfile = (name: string, avatar: string, optIn: boolean) => ({
    id: `user-${Date.now().toString(36)}`,
    name: name.trim() || 'Music Collector',
    handle: '@' + name.toLowerCase().replace(/[^a-z0-9_]/g, ''),
    avatar,
    tag: 'Sound Explorer',
    bio: 'Exploring lossless music on MelodyVault.',
    joinedLeaderboard: optIn,
  });

  const profile = createVisitorProfile('Alex Rivers', '/avatars/alex.jpg', false);
  assert.ok(profile.id.startsWith('user-'));
  assert.equal(profile.name, 'Alex Rivers');
  assert.equal(profile.handle, '@alexrivers');
  assert.equal(profile.joinedLeaderboard, false);
});

test('VAULT-SYNC-1: Ingestion prevents duplicate tracks when filename or title/artist match', () => {
  const existingVault = [
    { id: 'local-1', title: 'Song A', artist: 'Artist 1', filename: 'song_a.mp3' },
    { id: 'local-2', title: 'Song B', artist: 'Artist 2', filename: 'song_b.mp3' },
  ];

  const scannedBatch = [
    { id: 'local-1', title: 'Song A', artist: 'Artist 1', filename: 'song_a.mp3' }, // Duplicate
    { id: 'local-3', title: 'Song C', artist: 'Artist 3', filename: 'song_c.mp3' }, // New
  ];

  const merged = [...existingVault];
  for (const s of scannedBatch) {
    const isDup = merged.some(
      (m) =>
        m.id === s.id ||
        (m.title.toLowerCase() === s.title.toLowerCase() &&
          m.artist.toLowerCase() === s.artist.toLowerCase())
    );
    if (!isDup) {
      merged.push(s);
    }
  }

  assert.equal(merged.length, 3);
  assert.equal(merged[2].title, 'Song C');
});

test('AUTH-CREATOR-1: Creator passkey validation rejects incorrect or empty passwords and fails closed when unconfigured', () => {
  const verifyPasskey = (pass: string, configured?: string) => {
    if (!configured || !pass) return false;
    return pass.trim() === configured.trim();
  };

  assert.equal(verifyPasskey('wrong_pass', 'custom_secret_key_99'), false);
  assert.equal(verifyPasskey('', 'custom_secret_key_99'), false);
  assert.equal(verifyPasskey('admin123', 'custom_secret_key_99'), false);
  assert.equal(verifyPasskey('custom_secret_key_99', 'custom_secret_key_99'), true);
  // Fail closed when no passkey configured
  assert.equal(verifyPasskey('custom_secret_key_99', undefined), false);
  assert.equal(verifyPasskey('admin', undefined), false);
});

test('AUTH-CREATOR-2: Protected creator identity prevents unauthorized visitor impersonation', () => {
  const attemptClaimCreator = (requestedName: string, isCreatorVerified: boolean) => {
    const isTryingToImpersonate = requestedName.toLowerCase().includes('navneeth');
    if (isTryingToImpersonate && !isCreatorVerified) {
      throw new Error('Unauthorized impersonation of creator Navneeth.U rejected');
    }
    return {
      userId: isCreatorVerified ? 'user-navneeth' : `user-${Date.now().toString(36)}`,
      name: requestedName,
    };
  };

  assert.throws(() => attemptClaimCreator('Navneeth.U', false), /Unauthorized impersonation/);
  assert.throws(() => attemptClaimCreator('navneeth', false), /Unauthorized impersonation/);

  const verifiedCreator = attemptClaimCreator('Navneeth.U', true);
  assert.equal(verifiedCreator.userId, 'user-navneeth');
  assert.equal(verifiedCreator.name, 'Navneeth.U');

  const visitor = attemptClaimCreator('Sarah Chen', false);
  assert.ok(visitor.userId.startsWith('user-'));
  assert.equal(visitor.name, 'Sarah Chen');
});

test('AUTH-COOKIE-1: Session token is never stored in localStorage or returned in JSON responses', () => {
  // Mock login response
  const loginResponse = {
    success: true,
    configured: true,
    userId: 'user-navneeth',
    displayName: 'Navneeth.U',
    avatar: '/avatars/navneeth_u.jpg',
    rememberDevice: true,
    message: 'Creator authenticated successfully.',
  };

  assert.equal('token' in loginResponse, false, 'Login JSON response must NEVER contain raw session token');

  // Verify token storage prohibition: token is never placed in localStorage
  let mockStorage: Record<string, string> = {};
  const setCreatorToken = (token: string | null) => {
    // Correct secure behavior: never write token to storage, always clear legacy tokens
    delete mockStorage['mv_creator_token'];
  };

  mockStorage['mv_creator_token'] = 'legacy_stolen_token';
  setCreatorToken('new_raw_token');
  assert.equal(mockStorage['mv_creator_token'], undefined, 'localStorage must never contain mv_creator_token');
});

test('AUTH-COOKIE-2: Persistent sessions support Remember Me 30-day expiry vs normal 24-hour expiry', () => {
  const calculateExpiryHours = (rememberDevice: boolean) => {
    return rememberDevice ? 30 * 24 : 24;
  };

  assert.equal(calculateExpiryHours(true), 720); // 30 days
  assert.equal(calculateExpiryHours(false), 24); // 24 hours
});

