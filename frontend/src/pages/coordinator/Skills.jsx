import { useState, useEffect } from 'react';
import { skillAPI } from '../../services/api';
import { LoadingSpinner, EmptyState, Modal, ConfirmDialog } from '../../components/common/UIComponents';
import { Search, Plus, Edit2, Trash2, Tag, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

const Skills = () => {
  const [skills, setSkills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: ''
  });

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const response = await skillAPI.getSkills();
      const skillsData = response.data || [];
      setSkills(skillsData);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(skillsData.map(s => s.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      toast.error('Error fetching skills');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedSkill) {
        await skillAPI.updateSkill(selectedSkill._id, formData);
        toast.success('Skill updated successfully');
      } else {
        await skillAPI.createSkill(formData);
        toast.success('Skill created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchSkills();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving skill');
    }
  };

  const handleDelete = async () => {
    if (!selectedSkill) return;
    try {
      await skillAPI.deleteSkill(selectedSkill._id);
      toast.success('Skill deleted successfully');
      setShowDeleteDialog(false);
      setSelectedSkill(null);
      fetchSkills();
    } catch (error) {
      toast.error('Error deleting skill');
    }
  };

  const openEditModal = (skill) => {
    setSelectedSkill(skill);
    setFormData({
      name: skill.name,
      category: skill.category || '',
      description: skill.description || ''
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setSelectedSkill(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', category: '', description: '' });
    setSelectedSkill(null);
  };

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         skill.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || skill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group skills by category
  const groupedSkills = filteredSkills.reduce((acc, skill) => {
    const category = skill.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {});

  const categoryColors = {
    'Programming Languages': 'bg-blue-100 text-blue-800 border-blue-200',
    'Frameworks': 'bg-purple-100 text-purple-800 border-purple-200',
    'Databases': 'bg-green-100 text-green-800 border-green-200',
    'Cloud & DevOps': 'bg-orange-100 text-orange-800 border-orange-200',
    'Soft Skills': 'bg-pink-100 text-pink-800 border-pink-200',
    'Tools': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'default': 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const getCategoryColor = (category) => categoryColors[category] || categoryColors['default'];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Skill Management</h1>
          <p className="text-gray-600">Manage skill categories and definitions</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Skill
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Tag className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{skills.length}</p>
              <p className="text-sm text-gray-500">Total Skills</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-secondary-100 rounded-lg">
              <Layers className="w-6 h-6 text-secondary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              <p className="text-sm text-gray-500">Categories</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent-100 rounded-lg">
              <Tag className="w-6 h-6 text-accent-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {skills.filter(s => !s.category).length}
              </p>
              <p className="text-sm text-gray-500">Uncategorized</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="md:w-48"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Skills List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : Object.keys(groupedSkills).length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No skills found"
          description="Start by adding some skills to the system"
          action={{ label: 'Add Skill', onClick: openCreateModal }}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSkills).map(([category, categorySkills]) => (
            <div key={category} className="card">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900">{category}</h2>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {categorySkills.length} skills
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {categorySkills.map((skill) => (
                  <div
                    key={skill._id}
                    className={`group relative px-4 py-2 rounded-lg border ${getCategoryColor(category)} flex items-center gap-3`}
                  >
                    <span className="font-medium">{skill.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => openEditModal(skill)}
                        className="p-1 hover:bg-white/50 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSkill(skill);
                          setShowDeleteDialog(true);
                        }}
                        className="p-1 hover:bg-white/50 rounded text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={selectedSkill ? 'Edit Skill' : 'Add New Skill'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skill Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., JavaScript, Python, React"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Programming Languages, Frameworks"
              list="category-suggestions"
            />
            <datalist id="category-suggestions">
              {categories.map(cat => (
                <option key={cat} value={cat} />
              ))}
              <option value="Programming Languages" />
              <option value="Frameworks" />
              <option value="Databases" />
              <option value="Cloud & DevOps" />
              <option value="Soft Skills" />
              <option value="Tools" />
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the skill"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {selectedSkill ? 'Update Skill' : 'Add Skill'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedSkill(null);
        }}
        onConfirm={handleDelete}
        title="Delete Skill"
        message={`Are you sure you want to delete "${selectedSkill?.name}"? This action cannot be undone and may affect jobs and student profiles.`}
        confirmLabel="Delete"
        type="danger"
      />
    </div>
  );
};

export default Skills;
