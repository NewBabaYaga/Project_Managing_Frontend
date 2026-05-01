import { Link } from 'react-router-dom';
import Badge from '../Shared/Badge';
import { TrophyIcon } from '@heroicons/react/24/outline';

const medalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];

function SingleRankingTable({ entries, currentUserId, showGroupPoints = false }) {
  if (!entries || entries.length === 0)
    return <p className="text-sm text-gray-400 text-center py-4 italic">No entries yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-3 font-semibold text-gray-600 w-10">#</th>
            <th className="text-left py-2 px-3 font-semibold text-gray-600">Member</th>
            <th className="text-right py-2 px-3 font-semibold text-gray-600">Points</th>
            {showGroupPoints && (
              <>
                <th className="text-right py-2 px-3 font-semibold text-gray-600 hidden sm:table-cell">Own</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-600 hidden sm:table-cell">Group</th>
              </>
            )}
            <th className="text-right py-2 px-3 font-semibold text-gray-600 hidden sm:table-cell">Approved</th>
            <th className="text-right py-2 px-3 font-semibold text-gray-600 hidden md:table-cell">Rate</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => (
            <tr
              key={entry.userId}
              className={`border-b border-gray-100 hover:bg-gray-50 transition ${
                entry.userId === currentUserId ? 'bg-indigo-50' : ''
              }`}
            >
              <td className="py-2 px-3">
                {entry.rank <= 3 ? (
                  <TrophyIcon className={`w-4 h-4 ${medalColors[entry.rank - 1]}`} />
                ) : (
                  <span className="text-gray-400">{entry.rank}</span>
                )}
              </td>
              <td className="py-2 px-3">
                {entry.userId === currentUserId ? (
                  <span className="font-medium text-gray-900">{entry.username}</span>
                ) : (
                  <Link to={`/users/${entry.userId}`} className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
                    {entry.username}
                  </Link>
                )}
                {entry.userId === currentUserId && (
                  <Badge className="ml-2 bg-indigo-100 text-indigo-700">You</Badge>
                )}
              </td>
              <td className="py-2 px-3 text-right font-bold text-indigo-600">{entry.points}</td>
              {showGroupPoints && (
                <>
                  <td className="py-2 px-3 text-right text-gray-500 hidden sm:table-cell">{entry.personalPoints}</td>
                  <td className="py-2 px-3 text-right text-gray-500 hidden sm:table-cell">{entry.groupPoints}</td>
                </>
              )}
              <td className="py-2 px-3 text-right text-gray-700 hidden sm:table-cell">{entry.approvedTasks}</td>
              <td className="py-2 px-3 text-right text-gray-700 hidden md:table-cell">{entry.approvalRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RankingTable({ ranking, currentUserId }) {
  // Support both old array format (backward compat) and new { developerRanking, managerRanking } object
  if (!ranking) return <p className="text-sm text-gray-400 text-center py-6">No ranking data yet.</p>;

  const devRanking = ranking.developerRanking ?? (Array.isArray(ranking) ? ranking : []);
  const mgrRanking = ranking.managerRanking ?? [];

  if (devRanking.length === 0 && mgrRanking.length === 0)
    return <p className="text-sm text-gray-400 text-center py-6">No ranking data yet.</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 mb-2">
          Developer Ranking
        </h4>
        <SingleRankingTable entries={devRanking} currentUserId={currentUserId} />
      </div>

      {mgrRanking.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 mb-1">
            Manager Ranking
          </h4>
          <p className="text-xs text-gray-400 px-3 mb-2">Points = own tasks + group developers' tasks</p>
          <SingleRankingTable entries={mgrRanking} currentUserId={currentUserId} showGroupPoints={true} />
        </div>
      )}
    </div>
  );
}
