import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './DenLoop.css';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || '',
  process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY || ''
);

interface Group {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
  role: string;
  joined_at: string;
}

interface YourLoopsCardProps {
  profileId: string;
}

function YourLoopsCard({ profileId }: YourLoopsCardProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch groups where the profile is a member
        // First, get the group_ids for this profile
        const { data: profileGroups, error: profileGroupsError } = await supabase
          .from('profilesongroups')
          .select('group_id, role, joined_at')
          .eq('profile_id', profileId);

        if (profileGroupsError) throw profileGroupsError;

        if (profileGroups && profileGroups.length > 0) {
          // Then fetch the group details
          const groupIds = profileGroups.map((pg: any) => pg.group_id);
          const { data: groupsData, error: groupsError } = await supabase
            .from('groups')
            .select('id, name, created_by, created_at')
            .in('id', groupIds);

          if (groupsError) throw groupsError;

          // Combine the data
          const combinedGroups: Group[] = profileGroups.map((pg: any) => {
            const group = groupsData?.find((g: any) => g.id === pg.group_id);
            return group ? {
              id: group.id,
              name: group.name,
              created_by: group.created_by,
              created_at: group.created_at,
              role: pg.role,
              joined_at: pg.joined_at,
            } : null;
          }).filter((g: Group | null): g is Group => g !== null);

          setGroups(combinedGroups);
        } else {
          setGroups([]);
        }

      } catch (err: any) {
        setError(err.message || 'Failed to load groups');
        console.error('Error fetching groups:', err);
      } finally {
        setLoading(false);
      }
    };

    if (profileId) {
      fetchGroups();
    }
  }, [profileId]);

  return (
    <div className="denLoop-card">
      <h2>Your Loops</h2>
      {loading && <p>Loading groups...</p>}
      {error && (
        <div className="denLoop-message denLoop-message-error">
          {error}
        </div>
      )}
      {!loading && !error && (
        <>
          {groups.length === 0 ? (
            <p>You haven't joined any loops yet.</p>
          ) : (
            <div className="denLoop-groups-list">
              {groups.map((group) => (
                <div key={group.id} className="denLoop-group-item">
                  <div className="denLoop-group-name">{group.name}</div>
                  <div className="denLoop-group-role">{group.role}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default YourLoopsCard;

