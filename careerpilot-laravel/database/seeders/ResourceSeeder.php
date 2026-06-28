<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Skill;
use App\Models\Resource;

class ResourceSeeder extends Seeder
{
    public function run(): void
    {
        $resources = [
            [
                'skill_name'  => 'HTML5',
                'title'       => 'MDN HTML Docs',
                'url'         => 'https://developer.mozilla.org/en-US/docs/Web/HTML',
                'type'        => 'documentation',
                'description' => 'The definitive HTML reference by Mozilla.',
                'is_free'     => true,
            ],
            [
                'skill_name'  => 'CSS3',
                'title'       => 'CSS Tricks',
                'url'         => 'https://css-tricks.com',
                'type'        => 'tutorial',
                'description' => 'Practical CSS guides and snippets.',
                'is_free'     => true,
            ],
            [
                'skill_name'  => 'JavaScript',
                'title'       => 'JavaScript.info',
                'url'         => 'https://javascript.info',
                'type'        => 'tutorial',
                'description' => 'Modern JavaScript from the basics to advanced topics.',
                'is_free'     => true,
            ],
            [
                'skill_name'  => 'React.js',
                'title'       => 'React Official Docs',
                'url'         => 'https://react.dev',
                'type'        => 'documentation',
                'description' => 'Official React documentation with interactive examples.',
                'is_free'     => true,
            ],
            [
                'skill_name'  => 'Node.js',
                'title'       => 'Node.js Official Docs',
                'url'         => 'https://nodejs.org/en/docs',
                'type'        => 'documentation',
                'description' => 'Official Node.js API reference.',
                'is_free'     => true,
            ],
            [
                'skill_name'  => 'MongoDB',
                'title'       => 'MongoDB University',
                'url'         => 'https://learn.mongodb.com',
                'type'        => 'course',
                'description' => 'Free MongoDB courses from the official source.',
                'is_free'     => true,
            ],
            [
                'skill_name'  => 'Docker',
                'title'       => 'Docker Getting Started',
                'url'         => 'https://docs.docker.com/get-started',
                'type'        => 'documentation',
                'description' => 'Official Docker quickstart guide.',
                'is_free'     => true,
            ],
            [
                'skill_name'  => 'Python',
                'title'       => 'Python Official Tutorial',
                'url'         => 'https://docs.python.org/3/tutorial',
                'type'        => 'documentation',
                'description' => 'The official Python language tutorial.',
                'is_free'     => true,
            ],
        ]   ;

        foreach ($resources as $item) {
            $skill = Skill::where('name', $item['skill_name'])->first();
            if (!$skill) continue;

            Resource::updateOrCreate(
                ['url' => $item['url']],
                [
                    'title'       => $item['title'],
                    'url'         => $item['url'],
                    'type'        => $item['type'],
                    'skill_id'    => (string) $skill->_id,
                    'description' => $item['description'],
                    'is_free'     => $item['is_free'],
                    'is_active'   => true,
                ]
            );
        }

        $this->command->info('Resources seeded successfully.');
    }
}