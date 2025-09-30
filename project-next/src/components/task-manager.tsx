'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Task {
  id: number;
  title: string;
  is_complete: boolean;
  inserted_at: string;
}

interface PostgrestError {
  message: string;
}

export default function TaskManager({ user }: { user: User }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .order('inserted_at', { ascending: true });

      if (error) throw error;
      if (tasks) setTasks(tasks);
    } catch (error: unknown) {
      const pgError = error as PostgrestError;
      console.error('Error fetching tasks:', pgError.message);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const { data: task, error } = await supabase
        .from('tasks')
        .insert([{ title: newTaskTitle, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      if (task) setTasks([...tasks, task]);
      setNewTaskTitle('');
    } catch (error: unknown) {
      const pgError = error as PostgrestError;
      console.error('Error adding task:', pgError.message);
    }
  };

  const toggleTask = async (id: number, is_complete: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_complete: !is_complete })
        .eq('id', id);

      if (error) throw error;
      setTasks(tasks.map(task => 
        task.id === id ? { ...task, is_complete: !is_complete } : task
      ));
    } catch (error: unknown) {
      const pgError = error as PostgrestError;
      console.error('Error updating task:', pgError.message);
    }
  };

  const deleteTask = async (id: number) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTasks(tasks.filter(task => task.id !== id));
    } catch (error: unknown) {
      const pgError = error as PostgrestError;
      console.error('Error deleting task:', pgError.message);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <form onSubmit={addTask} className="flex gap-3 mb-8">
        <input
          type="text"
          placeholder="What needs to be done?"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-500 bg-white"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
        >
          Add Task
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-gray-600 bg-white">
              No tasks yet. Add one above to get started!
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {tasks.map(task => (
                <li
                  key={task.id}
                  className="hover:bg-slate-50 transition-colors duration-150 bg-white"
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center min-w-0">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={task.is_complete}
                          onChange={() => toggleTask(task.id, task.is_complete)}
                          className="h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span 
                          className={`ml-3 ${
                            task.is_complete 
                              ? 'line-through text-gray-500' 
                              : 'text-gray-900 font-medium'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center">
                      <span className="text-sm text-gray-600 font-medium">
                        {new Date(task.inserted_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="ml-6 text-sm font-medium text-red-600 hover:text-red-800 focus:outline-none focus:underline transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}