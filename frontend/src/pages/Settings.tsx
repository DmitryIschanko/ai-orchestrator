import { useState } from 'react'
import { 
  Settings as SettingsIcon,
  Bell,
  Shield,
  Users,
  Key,
  Save
} from 'lucide-react'

export function Settings() {
  const [activeTab, setActiveTab] = useState('general')
  const [saving, setSaving] = useState(false)

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'api', label: 'API Keys', icon: Key },
  ]

  const handleSave = async () => {
    setSaving(true)
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    alert('Settings saved!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 flex items-center">
        <SettingsIcon className="w-6 h-6 mr-2" />
        Settings
      </h1>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-lg shadow">
          {activeTab === 'general' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    defaultValue="My AI Company"
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mission Statement
                  </label>
                  <textarea
                    defaultValue="Building the future with AI agents"
                    className="w-full p-2 border rounded-lg h-24"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Zone
                  </label>
                  <select className="w-full p-2 border rounded-lg">
                    <option>UTC</option>
                    <option>America/New_York</option>
                    <option>Europe/London</option>
                    <option>Asia/Tokyo</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
              
              <div className="space-y-4">
                {[
                  'Budget alerts',
                  'Agent status changes',
                  'New approvals',
                  'Goal completions',
                  'System errors',
                ].map((setting) => (
                  <label key={setting} className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-3" />
                    <span className="text-gray-700">{setting}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input type="password" className="w-full p-2 border rounded-lg" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input type="password" className="w-full p-2 border rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Two-Factor Authentication
                  </label>
                  <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                    Enable 2FA
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
              
              <div className="space-y-3">
                {[
                  { name: 'Admin User', email: 'admin@example.com', role: 'Owner' },
                  { name: 'John Doe', email: 'john@example.com', role: 'Admin' },
                ].map((member) => (
                  <div key={member.email} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>

              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Invite Member
              </button>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
              
              <div className="space-y-3">
                {[
                  { name: 'Production', key: 'sk_live_...xyz789', created: '2024-03-01' },
                  { name: 'Development', key: 'sk_test_...abc123', created: '2024-03-15' },
                ].map((apiKey) => (
                  <div key={apiKey.name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-gray-900">{apiKey.name}</p>
                      <p className="text-sm text-gray-500 font-mono">{apiKey.key}</p>
                    </div>
                    <button className="text-red-600 hover:text-red-800 text-sm">
                      Revoke
                    </button>
                  </div>
                ))}
              </div>

              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Generate New Key
              </button>
            </div>
          )}

          {/* Save Button */}
          <div className="p-6 border-t">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
