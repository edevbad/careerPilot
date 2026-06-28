<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Skill;

class SkillSeeder extends Seeder
{
    public function run(): void
    {
        $skills = [
            // Frontend
            ['name' => 'HTML5',             'category' => 'Frontend'],
            ['name' => 'CSS3',              'category' => 'Frontend'],
            ['name' => 'JavaScript',        'category' => 'Frontend'],
            ['name' => 'React.js',          'category' => 'Frontend'],
            ['name' => 'Tailwind CSS',      'category' => 'Frontend'],

            // Backend
            ['name' => 'Node.js',           'category' => 'Backend'],
            ['name' => 'Express.js',        'category' => 'Backend'],
            ['name' => 'REST APIs',         'category' => 'Backend'],
            ['name' => 'MongoDB',           'category' => 'Database'],
            ['name' => 'SQL Basics',        'category' => 'Database'],

            // DevOps
            ['name' => 'Git & GitHub',      'category' => 'DevOps'],
            ['name' => 'Docker',            'category' => 'DevOps'],
            ['name' => 'Linux CLI',         'category' => 'DevOps'],

            // Data
            ['name' => 'Python',            'category' => 'Data Science'],
            ['name' => 'Pandas',            'category' => 'Data Science'],
            ['name' => 'Machine Learning',  'category' => 'Data Science'],
        ];

        foreach ($skills as $skill) {
            Skill::updateOrCreate(
                ['name' => $skill['name']],
                array_merge($skill, ['is_active' => true])
            );
        }

        $this->command->info('Skills seeded successfully.');
    }
}