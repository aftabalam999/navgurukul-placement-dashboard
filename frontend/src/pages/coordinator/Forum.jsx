import { useState, useEffect } from 'react';
import { questionAPI } from '../../services/api';
import { Trash, CheckCircle, MessageCircle, Building } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const CoordinatorForum = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const response = await questionAPI.getQuestions();
            setQuestions(response.data);
        } catch (error) {
            console.error('Error fetching questions:', error);
            toast.error('Failed to load questions');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this question?')) return;
        try {
            await questionAPI.deleteQuestion(id);
            toast.success('Question deleted');
            setQuestions(prev => prev.filter(q => q._id !== id));
        } catch (error) {
            toast.error('Failed to delete question');
        }
    };

    const handleAnswer = async (id, answer) => {
        try {
            await questionAPI.answerQuestion(id, answer);
            toast.success('Question answered');
            fetchQuestions(); // Refresh to update view
        } catch (error) {
            toast.error('Failed to submit answer');
        }
    };

    // Group questions by company
    const groupedQuestions = questions.reduce((acc, q) => {
        const company = q.companyName || 'Unknown Company';
        if (!acc[company]) acc[company] = [];
        acc[company].push(q);
        return acc;
    }, {});

    const pendingCount = questions.filter(q => !q.answer).length;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                        <MessageCircle className="w-8 h-8 text-primary-600" />
                        Q&A Forum
                    </h1>
                    <p className="text-gray-500 text-sm">Review and answer student queries about job tracks.</p>
                </div>
                {pendingCount > 0 && (
                    <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-2xl border border-red-100">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="text-red-700 text-xs font-bold uppercase tracking-wider">
                            {pendingCount} Pending Replies
                        </span>
                    </div>
                )}
            </div>

            <div className="space-y-10">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                        <p className="mt-4 text-gray-400 font-medium">Fetching conversation history...</p>
                    </div>
                ) : Object.keys(groupedQuestions).length > 0 ? (
                    Object.entries(groupedQuestions).map(([company, companyQuestions]) => (
                        <div key={company} className="space-y-4">
                            <div className="flex items-center gap-3 px-2">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <Building className="w-4 h-4 text-gray-500" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-800 tracking-tight">
                                    {company}
                                </h2>
                                <div className="h-px bg-gray-100 flex-1"></div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {companyQuestions.map((q) => (
                                    <div key={q._id} className="relative space-y-3 group px-1">
                                        {/* Question Bubble (Student) */}
                                        <div className="flex flex-col items-start max-w-[90%] md:max-w-[80%]">
                                            <div className="bg-white border-2 border-gray-100 rounded-2xl rounded-tl-none p-4 shadow-sm hover:border-primary-100 transition-all">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                        {q.jobTitle || 'General'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        {format(new Date(q.createdAt), 'h:mm a')}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium text-gray-900 leading-relaxed">
                                                    {q.question}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(q._id)}
                                                className="mt-1 ml-1 text-[10px] font-bold text-gray-300 hover:text-red-500 transition-colors uppercase tracking-widest"
                                            >
                                                Delete Question
                                            </button>
                                        </div>

                                        {/* Answer Bubble (Coordinator) */}
                                        {q.answer ? (
                                            <div className="flex flex-col items-end w-full">
                                                <div className="max-w-[90%] md:max-w-[80%] bg-primary-600 text-white rounded-2xl rounded-tr-none p-4 shadow-md shadow-primary-100">
                                                    <div className="flex items-center justify-end gap-2 mb-2 opacity-80">
                                                        <CheckCircle className="w-3 h-3" />
                                                        <span className="text-[10px] font-bold uppercase tracking-tighter">
                                                            Your Reply
                                                        </span>
                                                        <span className="text-[10px]">
                                                            {format(new Date(q.answeredAt || q.updatedAt), 'h:mm a')}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm leading-relaxed font-medium">
                                                        {q.answer}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-end w-full animate-in slide-in-from-right-2">
                                                <div className="w-full max-w-[90%] md:max-w-[80%] bg-amber-50 border-2 border-amber-200 border-dashed rounded-2xl rounded-tr-none p-4">
                                                    <div className="flex items-center gap-2 mb-3 text-amber-700">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                                        <span className="text-[10px] font-extrabold uppercase tracking-widest">
                                                            Reply Needed
                                                        </span>
                                                    </div>
                                                    <AnswerForm onSubmit={(answer) => handleAnswer(q._id, answer)} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="w-10 h-10 text-gray-200" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No active discussions</h3>
                        <p className="text-gray-500">Student questions will appear here conversationally.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const AnswerForm = ({ onSubmit }) => {
    const [answer, setAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!answer.trim()) return;

        setSubmitting(true);
        await onSubmit(answer);
        setSubmitting(false);
        setAnswer('');
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write an answer..."
                className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            />
            <button
                type="submit"
                disabled={submitting || !answer.trim()}
                className="btn btn-primary btn-sm whitespace-nowrap"
            >
                {submitting ? 'Submitting...' : 'Answer'}
            </button>
        </form>
    );
};

export default CoordinatorForum;
